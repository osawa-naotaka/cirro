import { createMarkdown } from "cirrojs/server";
// rehype-prism は prismjs コアの言語しかハイライトしないため、使う言語の文法を
// 同一 prismjs シングルトンに登録しておく（tsx は jsx/typescript/markup に依存）。
// @ts-expect-error prismjs/components/index.js は型定義を持たない Node 用ローダ。
import loadPrismLanguages from "prismjs/components/index.js";
import remarkGfm from "remark-gfm";

loadPrismLanguages(["markup", "css", "javascript", "typescript", "jsx", "tsx", "markdown", "bash", "json"]);

// cirro の Markdown 描画 API。サニタイズ（rehype-sanitize）は cirro が固定で強制するため、
// ここでは「サニタイズの上流」に積むユーザープラグインと、組み込み機能の有効化だけを宣言する。
//
// - remarkPlugins: GFM（テーブル・打消し線・タスクリスト等）。サニタイズの上流で動く。
// - toc: remark-export-toc による見出しへのシリアル id 付与 + 目次抽出（日本語見出しでも壊れない）。
// - highlight: rehype-prism。インラインスタイルを生成せずクラスベースで色付けする（style-src 'self' と両立）。
//
// 変換はビルド時（renderToStaticMarkup は同期）に行われ、結果は静的 HTML として埋め込まれる。
// クライアントへ unified 一式の JS は送られない。
export const { render: renderMarkdown } = createMarkdown({
    remarkPlugins: [remarkGfm],
    toc: true,
    highlight: true,
});
