import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createServerModuleRunner, createServer as createViteServer, build as viteBuild } from "vite";
import { expandRoutes, urlToFilePath, urlToCssFilePath } from "../router.ts";
import { appendClientScriptAndCss } from "./head.ts";
import { getCirroOptions } from "./options.ts";
import type { Registry } from "../registry.ts";
import { stringifyCss } from "../css.ts";

// `cirro build`: クライアントバンドルを作り、各ルートを静的 HTML として書き出す（node:fs のみ、bun 非依存）。
export async function runBuild() {
    // 1. クライアントバンドル + manifest（cirro プラグインが input/manifest/CSP 設定を注入）。
    await viteBuild();

    // 2. routes を評価するための一時 Vite server（ssrLoadModule）。
    const server = await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
    const runner = createServerModuleRunner(server.environments.ssr);
    try {
        const config = server.config;
        const options = getCirroOptions(config);
        const root = config.root;
        const outDir = resolve(root, config.build.outDir);
        const routesPath = resolve(root, options.routes);

        const manifest = JSON.parse(await readFile(join(outDir, ".vite/manifest.json"), "utf-8"));
        const entry = manifest["virtual:cirro/client"];
        if (!entry) throw new Error('cirro: manifest entry "virtual:cirro/client" not found');
        const scriptSrc = `/${entry.file}`;

        const { routes, getCssRegistry, initCssRegistry } = await runner.import(routesPath);
        for (const page of expandRoutes(routes)) {
            if (page.isCss) {
                initCssRegistry();
                // ツリー全体を描画して、ネストしたコンポーネント（Layout / 各島など）の
                // css() 呼び出しまでレジストリに登録する（HTML は破棄しレジストリだけ使う）。
                renderToStaticMarkup(page.render());
                const registry = getCssRegistry() as Registry;
                const css = stringifyCss(registry);
                const filePath = join(outDir, urlToCssFilePath(page.url));
                await mkdir(dirname(filePath), { recursive: true });
                await writeFile(filePath, css);
                console.log(`wrote ${filePath} (url: ${page.url})`);
                continue;
            }
            // クライアントスクリプトは React 要素ツリーを直接操作して <head> の末尾に挿入する（文字列置換しない）。
            // 本文は純粋な静的 HTML（マーカーなし）。島だけ <Island> 内の renderToString でマーカー付き。
            // CSS リンクはルート単位に生成した CSS（page.cssPath）を指す（dev と同じ挙動）。
            const tree = appendClientScriptAndCss(page.render(), scriptSrc, page.cssPath);
            const html = `<!DOCTYPE html>${renderToStaticMarkup(tree)}`;
            const filePath = join(outDir, urlToFilePath(page.url));
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, html);
            console.log(`wrote ${filePath} (url: ${page.url})`);
        }
    } finally {
        await server.close();
    }
}
