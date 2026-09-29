import type { Properties } from "../lib/properties";
import type { Site } from "../lib/site.ts";

export type Declarations = Partial<Properties>;

// 生成 CSS を表す小さな AST。css() / cssRules() / cssKeyframes() が登録時に構築し、
// stringifyCss() が再帰的に文字列化する。
// - StyleRule: セレクタ 1 個と宣言ブロック。selector は登録時点で $（自クラス参照）解決済み。
//   children はネストルール（cssRules）で、ネイティブ CSS ネストとしてブロック内に出力される
//   （& はブラウザがそのまま解釈する。生成側では置換しない）。
// - AtBlockRule: @layer / @media / @keyframes など任意のブロックアットルール。入れ子可。
// - AtStatementRule: "@layer a, b" のようなブロックを持たない文アットルール。
//   トップレベル専用で、出力時はプリアンブル直後に登録順で並ぶ（末尾の ; は出力時に付与）。
export type StyleRule = {
    type: "style";
    selector: string;
    declarations: Declarations;
    children?: RuleNode[];
};

export type AtBlockRule = {
    type: "at-block";
    prelude: string;
    children: RuleNode[];
};

export type AtStatementRule = {
    type: "at-statement";
    statement: string;
};

export type RuleNode = StyleRule | AtBlockRule | AtStatementRule;

// キーは designator（クラス名 / @keyframes 名 / 文のハッシュ）。同一キーの再登録は
// 上書きになるため、決定的ハッシュにより同一スタイルの重複出力が自然に排除される。
export type Registry = {
    style: Map<string, RuleNode[]>;
    icon: Set<string>;
};

export type BrokenLink = {
    cause: "broken-link";
    type: "not-found" | "malformed";
    link: string;
};

export type BrokenImageSrc = {
    cause: "broken-image-src";
    type: "not-found" | "unsupported" | "malformed" | "not-exist";
    from: string;
};

// site が未宣言のままサイトメタデータを必要とする機能を使った違反（12_SITE_METADATA.md 4.7）。
export type MissingSite = {
    cause: "missing-site";
    feature: string;
};

// 島の設定不整合（14_CONFIG_VALIDATION.md 4.3 / S1・S1'）。
// - not-configured: <Island> が描画されたのに cirro({ islands }) が未設定（ハイドレーションが走らない）
// - unknown-name: 描画された島名が、設定されたレジストリのキーに存在しない（マウンタが黙ってスキップする）
export type IslandError = {
    cause: "island";
    type: "not-configured" | "unknown-name";
    island: string;
};

// <Island> の props が JSON ラウンドトリップで同値に戻らない違反（14_CONFIG_VALIDATION.md 4.4 / S5）。
// data-props 経由でクライアントへ渡る際に黙って欠落・変質し、hydration mismatch の原因になる。
export type IslandPropsError = {
    cause: "island-props";
    island: string;
    // props 内のキーパス（例 "props.onClick"・"props.items[0].date"）
    path: string;
    kind: string;
};

// Markdown 本文中の参照（a href / img src）の違反（13_MARKDOWN_REF_CHECK.md 4.1・4.3）。
// JSX の <Link> / <Image> 起因（broken-link / broken-image-src）と区別できるよう、
// Markdown 由来であることと属性の別をレコードに含める（grep の当たり先が .md になるため）。
export type MarkdownRef = {
    cause: "markdown-ref";
    attr: "href" | "src";
    type: "not-found" | "malformed";
    ref: string;
};

export type ErrorInfo = BrokenLink | BrokenImageSrc | MissingSite | IslandError | IslandPropsError | MarkdownRef;

// レンダリング 1 回分のコンテキスト。ランタイム（dev / build）が構築して渡す。
// pagePath は現在レンダリング中ページのクリーン URL 正規形、htmlPaths は全 html ページの
// クリーン URL 一覧（sitemap 生成用）。islandNames は設定された島レジストリのキー集合
// （islands オプション未設定なら undefined。島の使用照合に使う）。
export type RenderContext = {
    site?: Site;
    pagePath?: string;
    htmlPaths?: string[];
    islandNames?: Set<string>;
};

export type RunWithRegistry<T> = (
    fn: () => T,
    init?: Registry,
    links?: Set<string>,
    siteContext?: RenderContext,
) => {
    result: T;
    registry: Registry;
    globalRuleDesignators: Set<string>;
    errors: ErrorInfo[];
};

export function createRegistry(): Registry {
    return {
        style: new Map(),
        icon: new Set(),
    };
}
