import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

// remark/rehype による Markdown → HTML 変換。
//
// 重要: この変換は「サイト側」で実行する。cirro 本体はまだ Markdown 変換 API を
// 提供していないため、利用者が自前で unified パイプラインを組む。
// 変換結果はビルド時に静的 HTML として埋め込まれ、クライアントへ JS は送られない。
//
// expandRoutes / component の描画は同期的に行われるため、ここでも非同期プラグインを
// 使わず processSync で同期変換する（remark-parse / remark-rehype / rehype-stringify は
// いずれも同期処理に対応している）。
const processor = unified()
    .use(remarkParse) // Markdown を mdast へ
    .use(remarkGfm) // テーブル・打消し線・タスクリスト等の GFM 拡張
    .use(remarkRehype) // mdast を hast へ（raw HTML は通さない＝コンテンツを実行可能にしない）
    .use(rehypeSlug) // 見出しに id を付与（アンカーリンク用）
    .use(rehypeStringify); // hast を HTML 文字列へ

// Markdown 本文を HTML 文字列に変換する。
export function markdownToHtml(markdown: string): string {
    return String(processor.processSync(markdown));
}
