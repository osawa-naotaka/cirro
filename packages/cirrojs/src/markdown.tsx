import type { Schema } from "hast-util-sanitize";
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
export function createMarkdown(config: MarkdownConfig = {}) {
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
        .use(config.highlight ? [rehypePrism] : []) // ── 信頼済み層（sanitize の下流・安全な構造だけ追加） ──
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
