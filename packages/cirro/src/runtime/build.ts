import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { build as viteBuild, createServer as createViteServer, createServerModuleRunner } from "vite";
import { expandRoutes, urlToFilePath } from "../router.js";
import { getCirroOptions } from "./options.js";

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

        const { routes } = await runner.import(routesPath);
        for (const page of expandRoutes(routes)) {
            // 本文は純粋な静的 HTML（マーカーなし）。島だけ <Island> 内の renderToString でマーカー付き。
            const body = renderToStaticMarkup(page.render());
            const html = `<!DOCTYPE html>${body.replace("</body>", `<script type="module" src="${scriptSrc}"></script></body>`)}`;
            const filePath = join(outDir, urlToFilePath(page.url));
            await mkdir(dirname(filePath), { recursive: true });
            await writeFile(filePath, html);
            console.log(`wrote ${filePath} (url: ${page.url})`);
        }
    } finally {
        await server.close();
    }
}
