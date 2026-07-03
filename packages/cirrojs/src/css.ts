// registerRules はランタイム値なので自己参照 import 経由で解決する。
// これにより exports の browser 条件が効き、クライアントでは async_hooks 非依存の
// no-op 実装（registry.browser.ts）に差し替わる。型は erase される import type で real から取得する。
import { registerRules } from "cirrojs/registry";
import { type Properties, property_names } from "./properties.ts";
import type { AtBlockRule, Declarations, Registry, RuleNode, StyleRule } from "./registry.ts";

export type CssOpt = {
    name?: string;
    atrules?: string[];
    selector?: string;
};

export function css(properties: Properties, opt?: CssOpt): string {
    const selector = opt?.selector ?? "$";
    const atrules = opt?.atrules ?? [];

    const node = atrules.reduceRight<RuleNode>((acc, cur) => at(cur, acc), ss(properties, { selector }));

    return toStyle(node, { name: opt?.name });
}

type CssFnT2Opt = {
    name?: string;
    selector?: string;
}

type CssFnT2 = (properties: Properties, opt?: CssFnT2Opt) => string;

type CssFnT2Arg = (injected: () => RuleNode) => RuleNode;

export function genCssFn2(arg: CssFnT2Arg): CssFnT2 {
    return (properties: Properties, opt?: CssFnT2Opt, ...children: RuleNode[]) => {
        const bottom = () => ss(properties, opt, ...children);
        const node = arg(bottom);
        return toStyle(node, { name: opt?.name });
    };
}

export type SsOpt = {
    selector?: string;
};

export function ss(declarations: Properties, opt?: SsOpt, ...children: RuleNode[]): RuleNode {
    return {
        type: "style",
        selector: opt?.selector ?? "$",
        declarations,
        children,
    }
}

export function at(prelude: string, ...children: RuleNode[]): RuleNode {
    return {
        type: "at-block",
        prelude,
        children,
    }
}

export type ToStyleOpt = {
    name?: string;
}

export function toStyle(node: RuleNode, opt?: ToStyleOpt): string {
    const hash = hash_djb2_object(node);
    const designator = `${opt?.name ?? "cirro"}-${hash.toString(16)}`;

    const resolved = resolveSelectorsInNode(node, `.${designator}`);
    registerRules(designator, [resolved]);
    
    return designator;
}

function resolveSelectorsInNode(node: RuleNode, designator: string): RuleNode {
    switch (node.type) {
        case "style":
            return { ...node, selector: resolveSelector(node.selector, designator), children: node.children?.map((child) => resolveSelectorsInNode(child, designator)) };
        case "at-statement":
            return node;
        case "at-block":
            return { ...node, children: node.children.map((child) => resolveSelectorsInNode(child, designator)) };
    }
}

// ネスト可能なスタイル定義。キーの先頭文字で解釈が決まる。
// - セレクタ記号（& : . # [ > + ~ *）で始まるキー: ネストされたセレクタ。ネイティブ CSS ネスト
//   としてそのまま出力され、& の解決はブラウザが行う（生成側では置換しない）。
//   要素型で始めたいセレクタは "& h2" / ":is(div.card) &" のように記号始まりへ書き換える。
// - "@" で始まるキー: ブロックアットルール。現在のセレクタ文脈の内側に入れ子で出力される。
// - それ以外のキー: CSS プロパティ（Properties として型チェックされる）。
// $ はトップレベルの selector 専用トークンのため、ネストキーでは使えない（ビルド時エラー）。
type SelectorPrefix = "&" | ":" | "." | "#" | "[" | ">" | "+" | "~" | "*";

export type NestedRules = Properties & {
    [K in `${SelectorPrefix}${string}` | `@${string}`]?: NestedRules;
};

const selector_key_prefixes = /* @__PURE__*/ new Set<string>(["&", "$", ":", ".", "#", "[", ">", "+", "~", "*"]);

export function cssRules(rules: NestedRules, opt?: CssOpt): string {
    const selector = opt?.selector ?? "$";
    const atrules = opt?.atrules ?? [];

    validateTopSelector(selector);
    for (const at of atrules) validateAtPrelude(at);

    const hash = hash_djb2_object({ selector, atrules, rules });
    const designator = `${opt?.name ?? "cirro"}-${hash.toString(16)}`;

    const { declarations, children } = buildNestedRules(rules);
    const root: StyleRule = {
        type: "style",
        selector: resolveSelector(selector, `.${designator}`),
        declarations,
        children,
    };
    registerRules(designator, wrapInAtRules(atrules, [root]));
    return designator;
}

// rules オブジェクトを「現在のセレクタ文脈の宣言」と「ネストされた子ルール群」へ分解する。
// セレクタの解決（& の適用・暗黙の子孫結合）はネイティブ CSS ネストとしてブラウザに委ねるため、
// ここではキーをそのまま AST に写すだけでよい。
function buildNestedRules(rules: NestedRules): { declarations: Declarations; children: RuleNode[] } {
    const declarations: Record<string, unknown> = {};
    const children: RuleNode[] = [];

    for (const [key, value] of Object.entries(rules)) {
        if (value === undefined) continue;
        const isAt = key.startsWith("@");
        const isSelector = selector_key_prefixes.has(key[0] ?? "");
        if (isAt || isSelector) {
            if (typeof value !== "object" || Array.isArray(value)) {
                throw new Error(`cirro: nested rules for "${key}" must be an object`);
            }
            const sub = buildNestedRules(value as NestedRules);
            if (isAt) {
                validateAtPrelude(key);
                // ネストしたアットルール直下の宣言は "&"（現在のセレクタ）に適用される。
                // 仕様上は裸の宣言と等価だが、AST を単純に保つため明示的に & { } で包む。
                const inner: RuleNode[] = [];
                if (Object.keys(sub.declarations).length > 0) {
                    inner.push({ type: "style", selector: "&", declarations: sub.declarations });
                }
                inner.push(...sub.children);
                children.push({ type: "at-block", prelude: key, children: inner });
            } else {
                validateNestedKey(key);
                if (Object.keys(sub.declarations).length > 0 || sub.children.length > 0) {
                    children.push({ type: "style", selector: key, declarations: sub.declarations, children: sub.children });
                }
            }
        } else {
            declarations[key] = value;
        }
    }

    return { declarations: declarations as Declarations, children };
}

// @keyframes のフレーム。キーは from / to / パーセンテージのみ（カンマ区切りは不可。
// 同じ宣言を複数のフレームに当てたい場合はキーを分けて書く）。
export type KeyframeFrames = Partial<Record<"from" | "to" | `${number}%`, Properties>>;

const keyframe_selector_re = /^(from|to|\d+(\.\d+)?%)$/;

export type CssKeyframesOpt = {
    name?: string;
    atrules?: string[];
};

// フレーム定義を登録し、アニメーション名（animation-name に渡す文字列）を返す。
// 名前はフレーム内容から決まる決定的ハッシュで、クラス名ではない点に注意。
export function cssKeyframes(frames: KeyframeFrames, opt?: CssKeyframesOpt): string {
    const atrules = opt?.atrules ?? [];
    for (const at of atrules) validateAtPrelude(at);

    const hash = hash_djb2_object({ atrules, frames });
    const name = `${opt?.name ?? "cirro-kf"}-${hash.toString(16)}`;

    const children: RuleNode[] = Object.entries(frames).map(([key, properties]) => {
        if (!keyframe_selector_re.test(key)) {
            throw new Error(`cirro: keyframe selector "${key}" must be "from", "to" or "<number>%"`);
        }
        return { type: "style", selector: key, declarations: (properties ?? {}) as Declarations };
    });
    registerRules(name, wrapInAtRules(atrules, [{ type: "at-block", prelude: `@keyframes ${name}`, children }]));
    return name;
}

export type CssFnT = (properties: Properties, opt?: Omit<CssOpt, "atrules">) => string;

export type GenCssFnOpt = {
    atRules?: string[];
    layer?: string;
};

export function genCssFn(opt: GenCssFnOpt): CssFnT {
    const atrules: string[] = [];
    if (opt.layer) atrules.push(`@layer ${opt.layer}`);
    if (opt.atRules) atrules.push(...opt.atRules);

    return (properties, opt) => {
        return css(properties, { atrules, name: opt?.name, selector: opt?.selector });
    };
}

export function stringifyCss(registry: Registry): string {
    // 文アットルールはプリアンブル直後にまとめる（@layer の順序宣言などが規則より先に来るように）。
    let statements = "";
    let rules = "";
    for (const nodes of registry.values()) {
        for (const node of nodes) {
            if (node.type === "at-statement") {
                validateAtPrelude(node.statement);
                statements += `${node.statement};\n`;
            } else {
                rules += `${stringifyRuleNode(node)}\n`;
            }
        }
    }
    return `@charset "utf-8";\n@layer base, font, low, main, high;\n${statements}${rules}`;
}

function stringifyRuleNode(node: RuleNode): string {
    if (node.type === "at-statement") {
        throw new Error(`cirro: at-statement "${node.statement}" is only allowed at the top level of the registry`);
    }
    if (node.type === "style") {
        validateSelector(node.selector);
        const parts: string[] = [];
        const body = Object.entries(node.declarations)
            .map(([k, v]) => stringifyProperty(k, v))
            .join(" ");
        if (body.length > 0) parts.push(body);
        // ネストルールはネイティブ CSS ネストとしてブロック内に出力する（& はブラウザが解釈する）。
        if (node.children) parts.push(...node.children.map(stringifyRuleNode));
        return `${node.selector} { ${parts.join(" ")} }`;
    }
    validateAtPrelude(node.prelude);
    return `${node.prelude} { ${node.children.map(stringifyRuleNode).join(" ")} }`;
}

function wrapInAtRules(atrules: string[], nodes: RuleNode[]): RuleNode[] {
    return atrules.reduceRight<RuleNode[]>((children, prelude): [AtBlockRule] => [{ type: "at-block", prelude, children }], nodes);
}

// "$"（自クラス参照）を機械的に全置換する。引用符やエスケープの解釈は行わない。
// $= の混入は validateTopSelector が事前に拒否する。引用文字列内に $ を書けない制約は
// doc に明記済み（将来セレクタパーサー導入時に緩和予定）。
function resolveSelector(selector: string, self: string): string {
    return selector.replaceAll("$", self);
}

// セレクタ・アットルールの検証。値は開発者が書くものだが、補間された値の事故や
// ブロック注入（"x } .evil {" のような波括弧の混入）をビルド時に確実に弾く。
function validateSelector(selector: string): void {
    if (selector.length > 512) throw new Error(`cirro: selector "${selector}" is too long(max 512 characters)`);
    if (/[{};]/.test(selector) || selector.includes("/*")) {
        throw new Error(`cirro: selector "${selector}" contains a forbidden sequence ("{", "}", ";" or "/*")`);
    }
}

// トップレベルセレクタ（css() / cssRules() の selector オプション）の検証。
// $ はここでのみ使えるトークンで、位置は先頭に限らない（例 ".parent:has(> $)"）。
function validateTopSelector(selector: string): void {
    validateSelector(selector);
    if (selector.includes("&")) {
        throw new Error(
            `cirro: "&" is not allowed in a top-level selector ("${selector}"). ` +
                `"&" is reserved for parent references inside cssRules() nesting. Use "$" to refer to the generated class itself.`,
        );
    }
    if (selector.includes("$=")) {
        throw new Error(
            `cirro: the attribute suffix matcher ("$=") is not supported in "${selector}" because every "$" is replaced with the generated class name`,
        );
    }
}

// ネストキー（cssRules() のセレクタキー）の検証。& はブラウザの CSS ネストに委ねるため
// そのまま許可する。$ はトップレベル専用トークンであり、ここで使うと暗黙の子孫結合により
// 意図と異なるセレクタが黙って生成されるため、エラーで拒否する。
function validateNestedKey(key: string): void {
    validateSelector(key);
    if (key.includes("$")) {
        throw new Error(
            `cirro: "$" is not allowed in a nested selector key ("${key}"). ` +
                `"$" is a top-level-only token; use "&" to refer to the parent selector inside cssRules() nesting.`,
        );
    }
}

function validateAtPrelude(prelude: string): void {
    if (prelude.length > 512) throw new Error(`cirro: at-rule "${prelude}" is too long(max 512 characters)`);
    if (!/^@[a-zA-Z-]+/.test(prelude)) {
        throw new Error(`cirro: at-rule "${prelude}" must start with "@" followed by an identifier`);
    }
    if (/[{};]/.test(prelude) || prelude.includes("/*")) {
        throw new Error(`cirro: at-rule "${prelude}" contains a forbidden sequence ("{", "}", ";" or "/*")`);
    }
}

// CSS Property
const allowed_property_names = /* @__PURE__*/ new Set<string>(property_names);

export function validatePropertyName(name: string): boolean {
    return name.startsWith("--") || allowed_property_names.has(name);
}

function stringifyProperty(k: string, v: unknown): string {
    if (k.length > 128) throw new Error(`Property name "${k}" is too long(max 128 characters)`);
    if (!validatePropertyName(k)) throw new Error(`Property name "${k}" is not a valid CSS property name`);

    if (Array.isArray(v)) {
        for (const item of v) {
            if (typeof item !== "string") throw new Error(`Property value "${item}" is not a string`);
            if (item.length > 512) throw new Error(`Property value "${item}" is too long(max 512 characters)`);
        }
        return `${k.replaceAll("_", "-")}: ${v.join(" ")};`;
    }
    if (typeof v !== "string") throw new Error(`Property value "${v}" is not a string`);
    if (v.length > 512) throw new Error(`Property value "${v}" is too long(max 512 characters)`);
    return `${k.replaceAll("_", "-")}: ${v};`;
}

function hash_djb2_object(...jsons: Record<string, unknown>[]): number {
    const chars = jsons.map((x) => JSON.stringify(x)).join("");
    return hash_djb2(chars);
}

function hash_djb2(s: string): number {
    let hash = 5381;
    for (const char of [...s]) {
        hash = ((hash << 5) + hash + char.charCodeAt(0)) & 0xffffffff;
    }
    return hash >>> 0;
}
