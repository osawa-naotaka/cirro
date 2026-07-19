import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer as createViteServer, build as viteBuild } from "vite";
import { stringifyCss } from "../lib/css.ts";
import { createRegistry, type ErrorInfo, type Registry, type RuleNode } from "../registry/registry.common.ts";
import { bundleIcon } from "./icon.ts";
import { cleanUrlPath, collectSiteLinks } from "./link.ts";
import { reportErrors } from "./report.ts";
import { expandRoutes } from "./router.ts";
import { appendClientScriptAndCss, setupCirro } from "./setup.ts";

// `cirro build`: クライアントバンドルを作り、各ルートを静的 HTML として書き出す（node:fs のみ、bun 非依存）。
export async function runBuild() {
    // dev / build の区別をページの SSR 描画へ伝える。HTML 描画は dev / build どちらも serve モードの
    // Vite サーバ経由のため import.meta.env では区別できない。CLI 側で process.env に明示する。
    process.env.CIRRO_COMMAND = "build";

    // 1. クライアントバンドル + manifest（cirro プラグインが input/manifest/CSP 設定を注入）。
    await viteBuild();

    // 2. routes を評価するための一時 Vite server（ssrLoadModule）。
    const server = await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
    try {
        const startTime = Date.now();
        const { loadRoutesModule, outDir, cssUrl } = setupCirro(server);
        const { runWithRegistry, contentHandler, site, routes } = await loadRoutesModule();

        const scriptSrc = await getScriptSrc(outDir);

        const rootRegistry: Registry = createRegistry();
        const htmlPagePaths: string[] = [];
        const globalRulePages = new Map<string, string[]>();
        const errorsWithPagePaths: { path: string; errors: ErrorInfo[] }[] = [];

        const content = contentHandler && (await contentHandler.loader());
        const pages = expandRoutes(routes, content);
        const links = collectSiteLinks(
            pages.filter((x) => x.type !== "css" && x.type !== "fontawesome"),
            server.config.publicDir,
        );
        // サイトメタデータ系ヘルパーが Store から引くコンテキスト（12_SITE_METADATA.md 4.3）。
        const htmlPaths = pages.filter((p) => p.type === "html").map((p) => cleanUrlPath(p.path));

        for (const page of pages) {
            switch (page.type) {
                case "css": {
                    break;
                }
                case "html": {
                    const {
                        result: html,
                        globalRuleDesignators,
                        errors,
                    } = runWithRegistry(
                        () => {
                            const tree = appendClientScriptAndCss(page.render(), scriptSrc, cssUrl);
                            return `<!DOCTYPE html>${renderToStaticMarkup(tree)}`;
                        },
                        rootRegistry,
                        links,
                        { site, pagePath: cleanUrlPath(page.path), htmlPaths },
                    );

                    if (errors.length > 0) {
                        errorsWithPagePaths.push({ path: page.path, errors });
                    }

                    htmlPagePaths.push(page.path);
                    for (const designator of globalRuleDesignators) {
                        const pages = globalRulePages.get(designator) ?? [];
                        pages.push(page.path);
                        globalRulePages.set(designator, pages);
                    }

                    await writeToFile(page.path, outDir, html);
                    break;
                }
                case "file": {
                    // sitemap / RSS 等のヘルパーが Store を参照するため、file ルートも
                    // レンダリングコンテキストで包む（レジストリは CSS 汚染を避けて独立させる）。
                    const { result: file, errors } = runWithRegistry(() => page.render(), createRegistry(), links, {
                        site,
                        pagePath: page.path,
                        htmlPaths,
                    });

                    if (errors.length > 0) {
                        errorsWithPagePaths.push({ path: page.path, errors });
                    }

                    await writeToFile(page.path, outDir, file);
                    break;
                }
                case "fontawesome": {
                    break;
                }
                default: {
                    throw new Error(`unknown page object: ${page}`);
                }
            }
        }

        const css = stringifyCss(rootRegistry);
        await writeToFile(cssUrl, outDir, css);

        bundleIcon(rootRegistry, outDir);

        console.log(`global rule set: ${globalRulePages.size} rules`);

        reportGlobalRuleMismatch(globalRulePages, htmlPagePaths, rootRegistry);
        for (const error of errorsWithPagePaths) {
            console.log(`errors in ${error.path}:`);
            reportErrors(error.errors);
        }

        if (errorsWithPagePaths.length === 0) {
            console.log("no broken links, broken image source, or missing sites found");
        } else {
            process.exitCode = 1;
        }

        console.log(`build completed in ${Date.now() - startTime}ms`);
    } finally {
        await server.close();
    }
}

async function writeToFile(path: string, outDir: string, content: string): Promise<void> {
    const filePath = join(outDir, path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
    console.log(`wrote ${filePath} (url: ${path})`);
}

async function getScriptSrc(outDir: string): Promise<string> {
    const manifest = JSON.parse(await readFile(join(outDir, ".vite/manifest.json"), "utf-8"));
    const entry = manifest["virtual:cirro/client"];
    if (!entry) throw new Error('cirro: manifest entry "virtual:cirro/client" not found');
    const scriptSrc = `/${entry.file}`;
    return scriptSrc;
}

// グローバル規則（$ を含まないセレクタ・文アットルール）が全ページで登録されているかを検査する。
// 欠けているページがあると、そのページの dev 表示（自ページ分のみの CSS）と build 表示
// （全ページ分をマージした CSS）が食い違うため、規則の中身と登録元ページを特定して警告する。
function reportGlobalRuleMismatch(globalRulePages: Map<string, string[]>, allPages: string[], registry: Registry): void {
    for (const [designator, pages] of globalRulePages) {
        if (pages.length === allPages.length) continue;
        const registered = new Set(pages);
        const missing = allPages.filter((p) => !registered.has(p));
        const rules = describeRuleNodes(registry.style.get(designator) ?? [])
            .map((s) => `"${s}"`)
            .join(", ");
        // 少ない側のページ一覧を出す（原因ページを特定しやすくするため）。
        const detail = pages.length <= missing.length ? `registered only on: ${pages.join(", ")}` : `missing on: ${missing.join(", ")}`;
        console.warn(`Warning: global rule ${rules} (${designator}) is not registered on all pages (${detail}); dev and build styles will differ.`);
    }
}

// 警告表示用に、登録済みルールノードからセレクタ・アットルール文を取り出す。
function describeRuleNodes(nodes: RuleNode[]): string[] {
    const out: string[] = [];
    const walk = (node: RuleNode): void => {
        if (node.type === "at-statement") {
            out.push(node.statement);
        } else if (node.type === "style") {
            out.push(node.selector);
        } else {
            node.children.forEach(walk);
        }
    };
    nodes.forEach(walk);
    return out;
}
