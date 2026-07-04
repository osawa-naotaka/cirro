import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createServerModuleRunner, createServer as createViteServer, build as viteBuild } from "vite";
import { stringifyCss } from "../css.ts";
import type { Registry } from "../registry.ts";
import { expandRoutes } from "../router.ts";
import { appendClientScriptAndCss } from "./head.ts";
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
        const runWithRegistry = obj.runWithRegistry as (
            fn: () => string,
            init?: Registry,
        ) => { result: string; registry: Registry; globalRuleSet: Set<string> };

        const rootRegistry = new Map();
        let globalRuleSet = new Set<string>();
        const pageRuleSets: [string, Set<string>][] = [];

        for (const page of expandRoutes(obj.default)) {
            switch (page.type) {
                case "css": {
                    break;
                }
                case "html": {
                    const { result: html, globalRuleSet: ruleSet } = runWithRegistry(() => {
                        const tree = appendClientScriptAndCss(page.render(), scriptSrc, cssUrl);
                        return `<!DOCTYPE html>${renderToStaticMarkup(tree)}`;
                    }, rootRegistry);
                    pageRuleSets.push([page.path, ruleSet]);
                    globalRuleSet = globalRuleSet.union(ruleSet);

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

        console.log(`global rule set: ${globalRuleSet.size} rules`);

        pageRuleSets.forEach(([path, ruleSet]) => {
            if (globalRuleSet.difference(ruleSet).size > 0) {
                console.log(`Warning: page ${path} has different rule set from global rule set, causes style mismatch.`);
            }
        });

        console.log(`build completed in ${Date.now() - startTime}ms`);
    } finally {
        await server.close();
    }
}
