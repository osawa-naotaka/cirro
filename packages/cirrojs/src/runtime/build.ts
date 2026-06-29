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

        const manifest = JSON.parse(await readFile(join(outDir, ".vite/manifest.json"), "utf-8"));
        const entry = manifest["virtual:cirro/client"];
        if (!entry) throw new Error('cirro: manifest entry "virtual:cirro/client" not found');
        const scriptSrc = `/${entry.file}`;

        const { routes, runWithRegistry } = await runner.import(routesPath);
        for (const page of expandRoutes(routes)) {
            switch (page.type) {
                case "css": {
                    const { registry } = runWithRegistry(() => renderToStaticMarkup(page.render())) as { registry: Registry };
                    const css = stringifyCss(registry);
                    const filePath = join(outDir, page.path);
                    await mkdir(dirname(filePath), { recursive: true });
                    await writeFile(filePath, css);
                    console.log(`wrote ${filePath} (url: ${page.path})`);
                    break;
                }
                case "html": {
                    const { result: html } = runWithRegistry(() => {
                        const tree = appendClientScriptAndCss(page.render(), scriptSrc, page.cssPath);
                        return `<!DOCTYPE html>${renderToStaticMarkup(tree)}`;
                    });
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
            }
        }
        console.log(`build completed in ${Date.now() - startTime}ms`);
    } finally {
        await server.close();
    }
}
