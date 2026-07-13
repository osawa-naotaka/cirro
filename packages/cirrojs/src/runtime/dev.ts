import { createServer as createHttpServer } from "node:http";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { stringifyCss } from "../lib/css.ts";
import { contentType } from "./contentType.ts";
import { reportBrokenImageSrc } from "./image.ts";
import { collectSiteLinks, reportBrokenLink } from "./link.ts";
import { expandRoutes } from "./router.ts";
import { appendClientScriptAndCss, setupCirro } from "./setup.ts";

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
    // dev / build の区別をページの SSR 描画へ伝える（runBuild と対。process.env.CIRRO_COMMAND を参照）。
    process.env.CIRRO_COMMAND = "dev";

    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom" });
    const { runWithRegistry, contentHandler, routes, islandsDir, watchDir, assetsUrl } = await setupCirro(vite);

    let contentPromise: Promise<unknown> | null = null;

    const httpServer = createHttpServer((req, res) => {
        function successResp(ext: string, body: string): void {
            res.statusCode = 200;
            res.setHeader("Content-Type", contentType(ext));
            res.end(body);
        }

        function errorResp(ext: string, content: string) {
            res.statusCode = 404;
            res.setHeader("Content-Type", contentType(ext));
            if (ext === ".html") {
                res.end(errorHtml(content));
            } else {
                res.end();
            }
            return;
        }

        vite.middlewares(req, res, async () => {
            const rawUrl = req.url ?? "/";
            const candidate = listupCandidate(rawUrl);

            try {
                contentPromise ??= contentHandler?.loader() || null;
                const content = await contentPromise;
                const pages = expandRoutes(routes, assetsUrl, content);
                const page = pages.find((p) => candidate.has(p.path));
                if (page === undefined) {
                    errorResp(".html", `no route found for the requested path: ${rawUrl}`);
                    return;
                }

                switch (page.type) {
                    case "html": {
                        const links = collectSiteLinks(
                            pages.filter((p) => p.type !== "css"),
                            vite.config.publicDir,
                        );

                        const {
                            result: html,
                            brokenLinks,
                            brokenImageSrc,
                        } = runWithRegistry(
                            () => {
                                const tree = appendClientScriptAndCss(page.render(), CLIENT_DEV_URL, `${page.path}.css`);
                                return `<!DOCTYPE html>${renderToStaticMarkup(tree)}`;
                            },
                            new Map(),
                            links,
                        );

                        reportBrokenLink(brokenLinks);
                        reportBrokenImageSrc(brokenImageSrc);

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
                    case "asset": {
                        const file = page.render();
                        successResp(page.ext, file);
                        break;
                    }
                }
                return;
            } catch (err) {
                // Module Runner はスタックトレースを自動補正するため ssrFixStacktrace は不要。
                res.statusCode = 500;
                res.setHeader("Content-Type", contentType(".html"));
                if (err instanceof Error) {
                    res.end(errorHtml(err.stack ?? String(err)));
                } else {
                    res.end(errorHtml(String(err)));
                }
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
    const onWatchEvent = (file: string) => {
        const f = file.replaceAll("\\", "/");
        if (islandsDir && f.startsWith(islandsDir)) return; // 島は Fast Refresh に任せる
        if (!f.startsWith(watchDir)) return; // 監視ディレクトリ外は無視
        invalidateModuleAndImporters(vite, file);
        contentPromise = null; // キャッシュを無効化
        vite.ws.send({ type: "full-reload" });
    };
    vite.watcher.on("change", onWatchEvent);
    // 追加・削除でも full-reload する。import.meta.glob で読むコンテンツ（Markdown 等）は
    // ファイル集合の変化で結果が変わるため。追加ファイルはモジュールグラフに未登録で
    // invalidateModuleAndImporters は何もしないが、glob importer（content.ts 等）の無効化は
    // Vite 本体が add/unlink 時に行う（getAffectedGlobModules）。ここではコンテンツキャッシュの
    // 破棄と full-reload を担う。
    vite.watcher.on("add", onWatchEvent);
    vite.watcher.on("unlink", onWatchEvent);

    httpServer.listen(port, () => {
        console.log(`cirro dev: http://localhost:${port}`);
    });
}

function listupCandidate(rawUrl: string): Set<string> {
    const pathname = new URL(rawUrl, "http://localhost").pathname;
    const candidate = new Set<string>();
    if (pathname.endsWith(".html") || pathname.endsWith(".htm")) {
        candidate.add(pathname);
    } else if (pathname.endsWith("/")) {
        candidate.add(`${pathname}index.html`);
        candidate.add(`${pathname}index.htm`);
    } else {
        candidate.add(`${pathname}.html`);
        candidate.add(`${pathname}.htm`);
        candidate.add(`${pathname}/index.html`);
        candidate.add(`${pathname}/index.htm`);
        candidate.add(pathname);
    }

    return candidate;
}

function errorHtml(message: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Error - cirro</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: sans-serif;
          background-color: #f8f8f8;
          color: #333;
        }
      </style>
    </head>
    <body><h1>Error</h1><pre>${message}</pre></body>
    </html>`;
}
