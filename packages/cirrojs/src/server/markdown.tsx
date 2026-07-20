import { checkMarkdownRef } from "cirrojs/registry";
import type { Schema } from "hast-util-sanitize";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toString as markdowToString } from "mdast-util-to-string";
import type { ReactElement } from "react";
import rehypePrism from "rehype-prism";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkExportToc, { type ToC } from "remark-export-toc";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type PluggableList, unified } from "unified";

export type { ToC } from "remark-export-toc";

// サニタイズ済みの HTML だけを表すブランド型。生の string を誤って
// dangerouslySetInnerHTML に渡せないよう、モジュール内部に閉じる。
declare const safe: unique symbol;
type SafeHtml = string & { readonly [safe]: true };

export interface MarkdownConfig {
    // sanitize より「前」に走る。ユーザーが自由に足せる層。
    // ここで何を生成しても、最後の rehype-sanitize が許可リストのサブセットだけを通す。
    remarkPlugins?: PluggableList;
    rehypePlugins?: PluggableList;
    // 既定スキーマ（hast-util-sanitize の defaultSchema にシリアル id 対応を加えたもの）を
    // 受け取り、拡張したスキーマを返す。サニタイズを無効化する手段はあえて提供しない。
    sanitizeSchema?: (defaults: Schema) => Schema;
    // remark-export-toc による見出しへのシリアル id 付与と ToC 抽出を有効化する。
    toc?: boolean | { prefix?: string; startLevel?: number };
    // rehype-prism によるシンタックスハイライト。インラインスタイルを生成せず
    // クラスベースで色付けするため、style-src 'self' の厳格 CSP と両立する。
    highlight?: boolean;
    // 本文中の a href / img src をビルド時に検証する（既定 true。13_MARKDOWN_REF_CHECK.md）。
    // ルート相対はサイトの URL 集合と照合、# アンカーとスキーム付き URL（外部）は素通し、
    // 相対パス・プロトコル相対は malformed。dev は警告、build はまとめて報告して非ゼロ終了。
    checkRefs?: boolean;
}

export interface RenderResult {
    // サニタイズ済み HTML を埋め込んだ、そのままマウントできる React 要素。
    body: ReactElement;
    // 抽出された目次。toc を無効にした場合は空配列。
    toc: ToC[];
}

// 設定済みの unified パイプラインを一度だけ構築し、Markdown 描画 API を返すファクトリ。
// createIsland と同じく、本モジュールはサーバー専用（ビルド時の HTML 化）で、
// unified / rehype-sanitize 一式はクライアントバンドルに混入させない。
export function createMarkdownProcessor(config: MarkdownConfig = {}) {
    const tocOptions = {
        prefix: "heading",
        startLevel: 2,
        ...(typeof config.toc === "object" ? config.toc : {}),
    };

    // remark-export-toc は id をシリアルに採番する（"heading-1" 等）。defaultSchema は
    // DOM clobbering 対策で id に "user-content-" を付与するが、それだと file.data.toc の
    // id とアンカー先がズレてリンクが壊れる。id はコンテンツ由来でなくプラグインが決定的に
    // 採番する値で、生 HTML も通さないため、clobber 対象から id だけ外して素の id を残す。
    const baseSchema: Schema = {
        ...defaultSchema,
        clobber: (defaultSchema.clobber ?? []).filter((name) => name !== "id"),
    };
    const schema = config.sanitizeSchema ? config.sanitizeSchema(baseSchema) : baseSchema;

    const processor = unified()
        .use(remarkParse)
        .use(config.remarkPlugins ?? []) // ── ユーザー層（sanitize の上流） ──
        .use(config.toc ? [[remarkExportToc, tocOptions]] : [])
        .use(remarkRehype) // raw HTML は通さない（allowDangerousHtml を渡さない）
        .use(config.rehypePlugins ?? []) // ── ユーザー層（sanitize の上流） ──
        .use(rehypeSanitize, schema) // ★ 固定の防衛線。ユーザーは越えられない
        // ── 信頼済み層（sanitize の下流） ── 検証対象を「実際に出力されるツリー」と一致させる
        .use(config.checkRefs !== false ? [rehypeCheckRefs] : [])
        .use(config.highlight ? [rehypePrism] : [])
        .use(rehypeStringify)
        .freeze();

    function toBody(html: SafeHtml, className?: string): ReactElement {
        // JSX（自動ランタイム）で生成する。createElement で事前生成した要素を子として埋め込むと
        // React 開発ビルドの子キー検証が誤検知して "unique key" 警告を出すため、利用側の素の
        // <div> と同じ挙動になる JSX で組む。html は rehype-sanitize を通した SafeHtml のみ（型で保証）。
        return (
            // biome-ignore lint/security/noDangerouslySetInnerHtml: SafeHtml（rehype-sanitize 済み）のみ注入する
            <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
        );
    }

    // 本文と目次を 1 パスで返す。renderToStaticMarkup は同期なので processSync を使う
    // （remark-export-toc / rehype-prism 等、既定の構成はすべて同期処理に対応している）。
    function render(source: string, options?: { className?: string }): RenderResult {
        const file = processor.processSync(source);
        const toc = (file.data as { toc?: ToC[] }).toc ?? [];
        return { body: toBody(String(file) as SafeHtml, options?.className), toc };
    }

    // 目次が不要なページ向けの糖衣。本文だけを描画する。
    function Markdown({ source, className }: { source: string; className?: string }): ReactElement {
        return render(source, { className }).body;
    }

    return { Markdown, render };
}

export function markdownToText(md: string) {
    return fromMarkdown(md)
        .children.map((x) => markdowToString(x))
        .join("\n");
}

// hast の最小構造型（依存を増やさないための構造的部分型）。
type HastNode = {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: HastNode[];
};

// スキーム付き URL（https: / mailto: 等）は外部参照として検証対象外（13_MARKDOWN_REF_CHECK.md 4.1）。
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

// 本文中の a href / img src を checkLink と同じレールで検証する組み込み rehype プラグイン
// （13_MARKDOWN_REF_CHECK.md 4.2）。sanitize 後の信頼済み層に置くため、ユーザープラグインが
// 生成したリンクも検証され、sanitize が落とした属性を誤検証することもない。
// 公開 API にはしない（利用者が sanitize より前に配線すると検証対象が最終ツリーとズレるため）。
function rehypeCheckRefs() {
    return (tree: HastNode): void => {
        walkRefs(tree);
    };
}

function walkRefs(node: HastNode): void {
    if (node.type === "element") {
        if (node.tagName === "a") {
            const href = node.properties?.href;
            if (typeof href === "string" && !SCHEME_RE.test(href)) {
                checkMarkdownRef("href", href);
            }
        } else if (node.tagName === "img") {
            const src = node.properties?.src;
            if (typeof src === "string" && !SCHEME_RE.test(src)) {
                checkMarkdownRef("src", src);
            }
        }
    }
    if (node.children) {
        for (const child of node.children) {
            walkRefs(child);
        }
    }
}
