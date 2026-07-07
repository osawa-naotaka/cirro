import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createServerModuleRunner, createServer as createViteServer, build as viteBuild } from "vite";
import { stringifyCss } from "../css.ts";
import type { Registry, RuleNode, RunWithRegistry } from "../registry.ts";
import { expandRoutes } from "../router.ts";
import { appendClientScriptAndCss } from "./head.ts";
import { collectLinks } from "./link.ts";
import { getCirroOptions } from "./options.ts";

// `cirro build`: クライアントバンドルを作り、各ルートを静的 HTML として書き出す（node:fs のみ、bun 非依存）。
export async function runBuild() {
    // dev / build の区別をページの SSR 描画へ伝える。HTML 描画は dev / build どちらも serve モードの
    // Vite サーバ経由のため import.meta.env では区別できない。CLI 側で process.env に明示する。
    process.env.CIRRO_COMMAND = "build";

    // 1. クライアントバンドル + manifest（cirro プラグインが input/manifest/CSP 設定を注入）。
    await viteBuild();

    // 2. routes を評価するための一時 Vite server（ssrLoadModule）。
    const server = await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
    const runner = createServerModuleRunner(server.environments.ssr);
    try {
        const startTime = Date.now();
        const config = server.config;
        const options = getCirroOptions(config);
        const root = config.root;
        const outDir = resolve(root, config.build.outDir);
        const routesPath = resolve(root, options.routes);
        const cssUrl = "/assets/styles.css";

        const manifest = JSON.parse(await readFile(join(outDir, ".vite/manifest.json"), "utf-8"));
        const entry = manifest["virtual:cirro/client"];
        if (!entry) throw new Error('cirro: manifest entry "virtual:cirro/client" not found');
        const scriptSrc = `/${entry.file}`;

        const obj = await runner.import(routesPath);
        if (typeof obj.runWithRegistry !== "function") throw new Error("cirro: you must export runWithRegistry.");
        if (typeof obj.default !== "object") throw new Error("cirro: you must export routes.");
        if (!Array.isArray(obj.default.routes)) throw new Error("cirro: you must define routes and export it as `default`");
        if (obj.default.content && typeof obj.default.content.loader !== "function") throw new Error("you must define a valid content loader function");

        const runWithRegistry = obj.runWithRegistry as RunWithRegistry<string>;
        const rootRegistry: Registry = new Map();
        const htmlPagePaths: string[] = [];
        const globalRulePages = new Map<string, string[]>();

        let content: unknown;
        if (obj.default.content) {
            content = await obj.default.content.loader();
        }
        const pages = expandRoutes(obj.default.routes, content);
        const links = collectLinks(pages);
        for (const page of pages) {
            switch (page.type) {
                case "css": {
                    break;
                }
                case "html": {
                    const {
                        result: html,
                        globalRuleSet: ruleSet,
                        brokenLinks,
                    } = runWithRegistry(
                        () => {
                            const tree = appendClientScriptAndCss(page.render(), scriptSrc, cssUrl);
                            return `<!DOCTYPE html>${renderToStaticMarkup(tree)}`;
                        },
                        rootRegistry,
                        links,
                    );

                    for (const link of brokenLinks) {
                        console.log(`Link is broken: "${link}" while rendering "${page.path}".`);
                    }

                    htmlPagePaths.push(page.path);
                    for (const designator of ruleSet) {
                        const pages = globalRulePages.get(designator) ?? [];
                        pages.push(page.path);
                        globalRulePages.set(designator, pages);
                    }

                    const filePath = join(outDir, page.path);
                    await mkdir(dirname(filePath), { recursive: true });
                    await writeFile(filePath, html);
                    console.log(`wrote ${filePath} (url: ${page.path})`);
                    break;
                }
                case "file": {
                    const file = page.render();
                    const filePath = join(outDir, page.path);
                    await mkdir(dirname(filePath), { recursive: true });
                    await writeFile(filePath, file);
                    console.log(`wrote ${filePath} (url: ${page.path})`);
                    break;
                }
                default: {
                    throw new Error(`unknown page object: ${page}`);
                }
            }
        }

        const css = stringifyCss(rootRegistry);
        const filePath = join(outDir, cssUrl);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, css);
        console.log(`wrote ${filePath} (url: ${cssUrl})`);

        console.log(`global rule set: ${globalRulePages.size} rules`);

        reportGlobalRuleMismatch(globalRulePages, htmlPagePaths, rootRegistry);

        console.log(`build completed in ${Date.now() - startTime}ms`);
    } finally {
        await server.close();
    }
}

// グローバル規則（$ を含まないセレクタ・文アットルール）が全ページで登録されているかを検査する。
// 欠けているページがあると、そのページの dev 表示（自ページ分のみの CSS）と build 表示
// （全ページ分をマージした CSS）が食い違うため、規則の中身と登録元ページを特定して警告する。
function reportGlobalRuleMismatch(globalRulePages: Map<string, string[]>, allPages: string[], registry: Registry): void {
    for (const [designator, pages] of globalRulePages) {
        if (pages.length === allPages.length) continue;
        const registered = new Set(pages);
        const missing = allPages.filter((p) => !registered.has(p));
        const rules = describeRuleNodes(registry.get(designator) ?? [])
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
