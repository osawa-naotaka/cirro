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

export type ErrorInfo = BrokenLink | BrokenImageSrc | MissingSite;

// レンダリング 1 回分のサイトコンテキスト。ランタイム（dev / build）が構築して渡す。
// pagePath は現在レンダリング中ページのクリーン URL 正規形、htmlPaths は全 html ページの
// クリーン URL 一覧（sitemap 生成用）。
export type RenderSiteContext = {
    site?: Site;
    pagePath?: string;
    htmlPaths?: string[];
};

export type RunWithRegistry<T> = (
    fn: () => T,
    init?: Registry,
    links?: Set<string>,
    siteContext?: RenderSiteContext,
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
