import { createServer as createHttpServer } from "node:http";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer as createViteServer } from "vite";

// Vite を middleware モードで起動し、SSR + HMR の開発サーバを構成する。
// - ルーティング: src/routes.ts を展開し、URL → ページのマップで解決（build と同じ expandRoutes を使用）
// - 本文: renderToStaticMarkup（マーカーなし）。島は <Island> 内の renderToString。
// - 島: /src/client.tsx を Vite が変換配信し、React Fast Refresh が効く
// 注意: dev では HMR 用のインラインスクリプトが入るが、本番ビルド(dist)の CSP 厳格性には影響しない。
const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
});

const httpServer = createHttpServer((req, res) => {
    vite.middlewares(req, res, async () => {
        const rawUrl = req.url ?? "/";
        try {
            // ssrLoadModule で最新の routes / router を読む（HMR と整合）。
            const { routes } = await vite.ssrLoadModule("/src/routes.ts");
            const { expandRoutes } = await vite.ssrLoadModule("/src/router.ts");
            const pages = expandRoutes(routes);

            const pathname = new URL(rawUrl, "http://localhost").pathname;
            const normalized = pathname.replace(/\/+$/, "") || "/";
            const page = pages.find((p: { url: string }) => (p.url.replace(/\/+$/, "") || "/") === normalized);

            if (!page) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end('<!DOCTYPE html><meta charset="utf-8"><h1>404 Not Found</h1>');
                return;
            }

            const appHtml = renderToStaticMarkup(page.render());
            let html = `<!DOCTYPE html>${appHtml}`.replace("</body>", `<script type="module" src="/src/client.tsx"></script></body>`);
            // Vite の HMR クライアント・preamble を注入する。
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

// src/pages 配下と src/routes.ts の変更でブラウザを full-reload（島のクライアント変更は Vite の HMR に任せる）。
vite.watcher.on("change", (file) => {
    if (/\/src\/(pages\/.+|routes)\.[jt]sx?$/.test(file.replaceAll("\\", "/"))) {
        vite.ws.send({ type: "full-reload" });
        console.log(`[full-reload] ${file}`);
    }
});

const port = 5173;
httpServer.listen(port, () => {
    console.log(`dev server on http://localhost:${port}`);
});
