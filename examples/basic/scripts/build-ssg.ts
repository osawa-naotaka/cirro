import { renderToStaticMarkup } from "react-dom/server";
import { expandRoutes, urlToFilePath } from "cirro";
import { routes } from "../src/routes";

// Vite が出力した manifest から、島クライアントエントリの最終ファイル名を取得する。
const manifestPath = "dist/.vite/manifest.json";
const manifest = JSON.parse(await Bun.file(manifestPath).text());
const entry = manifest["virtual:cirro/client"];
if (!entry) {
    throw new Error(`manifest entry "virtual:cirro/client" not found in ${manifestPath}`);
}
const scriptSrc = `/${entry.file}`;

// 全ルートを展開し、各ページを純粋な静的 HTML として書き出す。
// 本文は renderToStaticMarkup（マーカーなし）。島だけ <Island> 内の renderToString でマーカー付き。
for (const page of expandRoutes(routes)) {
    const bodyHtml = renderToStaticMarkup(page.render());
    // 外部スクリプトを 1 本だけ注入する（インラインスクリプトは一切使わない）。
    const html = `<!DOCTYPE html>${bodyHtml.replace("</body>", `<script type="module" src="${scriptSrc}"></script></body>`)}`;
    const filePath = `dist/${urlToFilePath(page.url)}`;
    await Bun.write(filePath, html);
    console.log(`wrote ${filePath} (url: ${page.url})`);
}
