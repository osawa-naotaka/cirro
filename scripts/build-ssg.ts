import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Page } from "../src/pages/index.tsx";

// Vite が出力した manifest から、島クライアントエントリの最終ファイル名を取得する。
const manifestPath = "dist/.vite/manifest.json";
const manifest = JSON.parse(await Bun.file(manifestPath).text());
const entry = manifest["src/client.tsx"];
if (!entry) {
    throw new Error(`manifest entry "src/client.tsx" not found in ${manifestPath}`);
}
const scriptSrc = `/${entry.file}`;

// 本文は純粋な静的 HTML（マーカーなし）として描画する。
// 島だけは <Island> 内の renderToString でマーカー付き HTML が埋め込まれる。
const bodyHtml = renderToStaticMarkup(createElement(Page));

// 外部スクリプトを 1 本だけ注入する（インラインスクリプトは一切使わない）。
const html = `<!DOCTYPE html>${bodyHtml.replace("</body>", `<script type="module" src="${scriptSrc}"></script></body>`)}`;

await Bun.write("dist/index.html", html);
console.log(`wrote dist/index.html (script: ${scriptSrc})`);
