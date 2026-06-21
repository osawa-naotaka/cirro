import { createServer as createHttpServer } from "node:http";
import { dirname, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createServerModuleRunner, createServer as createViteServer, type ViteDevServer } from "vite";
import { stringifyCss } from "../css.ts";
import { expandRoutes } from "../router.ts";
import { contentType } from "./contentType.ts";
import { appendClientScriptAndCss } from "./head.ts";
import { getCirroOptions } from "./options.ts";

// 仮想島マウンタ（virtual:cirro/client）の dev 配信 URL。
const CLIENT_DEV_URL = "/@id/__x00__virtual:cirro/client";

// 変更ファイルとその参照元（importer）を SSR 環境のモジュールグラフ上で無効化する。
// Module Runner は import 時にサーバーから invalidate フラグを受け取り、立っていれば再評価する
// （module-runner の fetchModule 連携）。そのため、グラフ側で無効化しておけば次の runner.import で
// 最新が読み込まれる。Markdown（?raw）→ content → routes と参照元を辿って無効化することで、
// HMR 境界を持たないコンテンツ変更でも routes が確実に再評価される。
function invalidateModuleAndImporters(vite: ViteDevServer, file: string): void {
    const candidates = [file, file.replaceAll("\\", "/")];
    for (const env of Object.values(vite.environments)) {
        const mg = env.moduleGraph;
        if (!mg) continue;
        const seen = new Set<unknown>();
        const walk = (mod: { importers: Set<unknown> }) => {
            if (seen.has(mod)) return;
            seen.add(mod);
            mg.invalidateModule(mod as never);
            for (const importer of mod.importers) walk(importer as { importers: Set<unknown> });
        };
        for (const path of candidates) {
            const mods = mg.getModulesByFile(path);
            if (!mods) continue;
            for (const mod of mods) walk(mod as unknown as { importers: Set<unknown> });
        }
    }
}

// `cirro dev`: Vite を middleware モードで起動し、SSR + ルーティング + HMR を提供する。
export async function runDev(port = 5173) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom" });
    const runner = createServerModuleRunner(vite.environments.ssr);
    const options = getCirroOptions(vite.config);
    const root = vite.config.root;
    const routesPath = resolve(root, options.routes);
    const islandsDir = dirname(resolve(root, options.islands)).replaceAll("\\", "/");

    const httpServer = createHttpServer((req, res) => {
        function successResp(ext: string, body: string): void {
            res.statusCode = 200;
            res.setHeader("Content-Type", contentType(ext));
            res.end(body);
        }

        function errorResp(ext: string) {
            res.statusCode = 404;
            res.setHeader("Content-Type", contentType(ext));
            if (ext === ".html") {
                res.end('<!DOCTYPE html><meta charset="utf-8"><h1>404 Not Found</h1>');
            } else {
                res.end();
            }
            return;
        }

        vite.middlewares(req, res, async () => {
            const rawUrl = req.url ?? "/";
            const pathname = new URL(rawUrl, "http://localhost").pathname;
            const normalized = pathname.replace(/\/+$/, "") || "/";
            try {
                // routes は Module Runner で最新を読む（HMR と整合）。
                const { routes, runWithRegistry } = await runner.import(routesPath);
                const pages = expandRoutes(routes);
                const page = pages.find((p) => p.path === normalized);
                if (page === undefined) {
                    errorResp(".html");
                    return;
                }

                switch (page.type) {
                    case "html": {
                        const { result: html } = runWithRegistry(() => {
                            const tree = appendClientScriptAndCss(page.render(), CLIENT_DEV_URL, page.cssPath);
                            return `<!DOCTYPE html>${renderToStaticMarkup(tree)}`;
                        });
                        const transformed = await vite.transformIndexHtml(rawUrl, html);
                        successResp(".html", transformed);
                        break;
                    }
                    case "css": {
                        const { registry } = runWithRegistry(() => renderToStaticMarkup(page.render()));
                        const css = stringifyCss(registry);
                        successResp(".css", css);
                        break;
                    }
                    case "file": {
                        const file = page.render();
                        successResp(page.ext, file);
                        break;
                    }
                }
                return;
            } catch (err) {
                // Module Runner はスタックトレースを自動補正するため ssrFixStacktrace は不要。
                res.statusCode = 500;
                res.end(String(err));
            }
        });
    });

    // 島（islands ディレクトリ）以外のサーバーソース変更で full-reload（島は Fast Refresh に任せる）。
    //
    // ページ・ルート定義（.tsx/.ts）だけでなく、Markdown などビルド時に SSR で HTML 化される
    // 「コンテンツ」も対象にする。これらはクライアント HMR の境界を持たないため、ファイル拡張子で
    // 絞らず、islands 以外の監視ディレクトリ配下の変更はすべて full-reload とする。
    // full-reload で SSR を再実行させる前に、変更ファイルとその参照元（routes 等）の SSR モジュール
    // キャッシュを無効化しておく。これをしないと Module Runner が古い Markdown を返す可能性がある。
    //
    // 監視ディレクトリは config の watchDir（既定 "./src"）で設定する。
    const watchDir = `${resolve(root, options.watchDir ?? "./src")
        .replaceAll("\\", "/")
        .replace(/\/+$/, "")}/`;
    vite.watcher.on("change", (file) => {
        const f = file.replaceAll("\\", "/");
        if (f.startsWith(islandsDir)) return; // 島は Fast Refresh に任せる
        if (!f.startsWith(watchDir)) return; // 監視ディレクトリ外は無視
        invalidateModuleAndImporters(vite, file);
        vite.ws.send({ type: "full-reload" });
    });

    httpServer.listen(port, () => {
        console.log(`cirro dev: http://localhost:${port}`);
    });
}
