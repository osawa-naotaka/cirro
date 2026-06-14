import { createServer as createHttpServer } from "node:http";
import { dirname, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer as createViteServer } from "vite";
import { expandRoutes } from "../router.js";
import { getCirroOptions } from "./options.js";

// 仮想島マウンタ（virtual:cirro/client）の dev 配信 URL。
const CLIENT_DEV_URL = "/@id/__x00__virtual:cirro/client";

// `cirro dev`: Vite を middleware モードで起動し、SSR + ルーティング + HMR を提供する。
export async function runDev(port = 5173) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom" });
    const options = getCirroOptions(vite.config);
    const root = vite.config.root;
    const routesPath = resolve(root, options.routes);
    const islandsDir = dirname(resolve(root, options.islands)).replaceAll("\\", "/");

    const httpServer = createHttpServer((req, res) => {
        vite.middlewares(req, res, async () => {
            const rawUrl = req.url ?? "/";
            try {
                // routes は ssrLoadModule で最新を読む（HMR と整合）。
                const { routes } = await vite.ssrLoadModule(routesPath);
                const pages = expandRoutes(routes);

                const pathname = new URL(rawUrl, "http://localhost").pathname;
                const normalized = pathname.replace(/\/+$/, "") || "/";
                const page = pages.find((p) => (p.url.replace(/\/+$/, "") || "/") === normalized);

                if (!page) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "text/html; charset=utf-8");
                    res.end('<!DOCTYPE html><meta charset="utf-8"><h1>404 Not Found</h1>');
                    return;
                }

                const appHtml = renderToStaticMarkup(page.render());
                let html = `<!DOCTYPE html>${appHtml}`.replace("</body>", `<script type="module" src="${CLIENT_DEV_URL}"></script></body>`);
                html = await vite.transformIndexHtml(rawUrl, html);
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end(html);
            } catch (err) {
                vite.ssrFixStacktrace(err as Error);
                res.statusCode = 500;
                res.end(String(err));
            }
        });
    });

    // 島（islands ディレクトリ）以外のサーバーソース変更で full-reload（島は Fast Refresh に任せる）。
    vite.watcher.on("change", (file) => {
        const f = file.replaceAll("\\", "/");
        if (!/\.[jt]sx?$/.test(f)) return;
        if (f.startsWith(islandsDir)) return;
        if (f.includes("/src/")) vite.ws.send({ type: "full-reload" });
    });

    httpServer.listen(port, () => {
        console.log(`cirro dev: http://localhost:${port}`);
    });
}
