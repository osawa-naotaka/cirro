import { createServer as createHttpServer } from "node:http";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer as createViteServer } from "vite";

// Vite を middleware モードで起動し、SSR + HMR の開発サーバを構成する。
// - 本文: リクエストごとに ssrLoadModule で最新の Page を読み、renderToString で生成（保存即反映）
// - 島: /src/client.tsx を Vite が変換配信し、React Fast Refresh が効く
// 注意: dev では HMR 用のインラインスクリプトが入るが、本番ビルド(dist)の CSP 厳格性には影響しない。
const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
});

const httpServer = createHttpServer((req, res) => {
    vite.middlewares(req, res, async () => {
        const url = req.url ?? "/";
        try {
            const { Page } = await vite.ssrLoadModule("/src/pages/index.tsx");
            const appHtml = renderToStaticMarkup(createElement(Page));
            let html = `<!DOCTYPE html>${appHtml}`.replace("</body>", `<script type="module" src="/src/client.tsx"></script></body>`);
            // Vite の HMR クライアント・preamble を注入する。
            html = await vite.transformIndexHtml(url, html);
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end(html);
        } catch (err) {
            vite.ssrFixStacktrace(err as Error);
            res.statusCode = 500;
            res.end(String(err));
        }
    });
});

// 本文（src/pages）はサーバーレンダリングなので Fast Refresh が効かない。
// 変更を検知したらブラウザに full-reload を送る（島のクライアント変更は Vite の HMR に任せる）。
vite.watcher.on("change", (file) => {
    // src/pages 配下の実ソース（.ts/.tsx/.js/.jsx）のみ対象（エディタの一時ファイルは除外）。
    if (/\/src\/pages\/.*\.[jt]sx?$/.test(file.replaceAll("\\", "/"))) {
        vite.ws.send({ type: "full-reload" });
        console.log(`[full-reload] ${file}`);
    }
});

const port = 5173;
httpServer.listen(port, () => {
    console.log(`dev server on http://localhost:${port}`);
});
