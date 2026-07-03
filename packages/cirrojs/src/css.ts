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

    validateSelector(selector);
    for (const at of atrules) validateAtPrelude(at);

    const hash = hash_djb2_object({ selector, atrules, properties });
    const designator = `${opt?.name ?? "cirro"}-${hash.toString(16)}`;

    const rule: StyleRule = {
        type: "style",
        selector: resolveSelector(selector, `.${designator}`),
        declarations: properties,
    };
    registerRules(designator, wrapInAtRules(atrules, [rule]));
    return designator;
}

// ネスト可能なスタイル定義。プロパティ以外のキーは接頭辞で解釈が決まる。
// - "$..." : 自クラス（この呼び出しが生成したクラス）を基点とするセレクタ
// - "&..." : 直近の親セレクタを基点とするセレクタ（CSS ネストの & と同じ意味論）
// - "@..." : ブロックアットルール。その内側に現在のセレクタ文脈が引き継がれる
export type NestedRules = Properties & {
    [key: `$${string}`]: NestedRules | undefined;
    [key: `&${string}`]: NestedRules | undefined;
    [key: `@${string}`]: NestedRules | undefined;
};

export function cssRules(rules: NestedRules, opt?: CssOpt): string {
    const selector = opt?.selector ?? "$";
    const atrules = opt?.atrules ?? [];

    validateSelector(selector);
    for (const at of atrules) validateAtPrelude(at);

    const hash = hash_djb2_object({ selector, atrules, rules });
    const designator = `${opt?.name ?? "cirro"}-${hash.toString(16)}`;

    const nodes = buildNestedRules(rules, resolveSelector(selector, `.${designator}`), `.${designator}`);
    registerRules(designator, wrapInAtRules(atrules, nodes));
    return designator;
}

function buildNestedRules(rules: NestedRules, parentSelector: string, self: string): RuleNode[] {
    const declarations: Record<string, unknown> = {};
    const children: RuleNode[] = [];

    for (const [key, value] of Object.entries(rules)) {
        if (value === undefined) continue;
        if (key.startsWith("&") || key.startsWith("$") || key.startsWith("@")) {
            if (typeof value !== "object" || Array.isArray(value)) {
                throw new Error(`cirro: nested rules for "${key}" must be an object`);
            }
        }
        if (key.startsWith("&") || key.startsWith("$")) {
            validateSelector(key);
            // 単純な文字列置換で親を解決するため、カンマ区切りの親は :is() 相当の意味論と
            // 結果がズレる。ネストキーではカンマを禁止して、そのズレを作らせない。
            if (key.includes(",")) throw new Error(`cirro: nested selector "${key}" must not contain a comma`);
            const resolved = resolveSelector(key, self, parentSelector);
            children.push(...buildNestedRules(value as NestedRules, resolved, self));
        } else if (key.startsWith("@")) {
            validateAtPrelude(key);
            children.push({ type: "at-block", prelude: key, children: buildNestedRules(value as NestedRules, parentSelector, self) });
        } else {
            declarations[key] = value;
        }
    }

    const nodes: RuleNode[] = [];
    if (Object.keys(declarations).length > 0) {
        nodes.push({ type: "style", selector: parentSelector, declarations: declarations as Declarations });
    }
    nodes.push(...children);
    return nodes;
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
        const body = Object.entries(node.declarations)
            .map(([k, v]) => stringifyProperty(k, v))
            .join(" ");
        return `${node.selector} { ${body} }`;
    }
    validateAtPrelude(node.prelude);
    return `${node.prelude} { ${node.children.map(stringifyRuleNode).join(" ")} }`;
}

function wrapInAtRules(atrules: string[], nodes: RuleNode[]): RuleNode[] {
    return atrules.reduceRight<RuleNode[]>((children, prelude): [AtBlockRule] => [{ type: "at-block", prelude, children }], nodes);
}

// セレクタ中の自己参照トークンを解決する。
// - "$" は self（生成クラス）へ置換する。ただし属性セレクタの後方一致（$=）は対象外。
// - "&" は parent（親セレクタ）へ置換する。親が存在しないトップレベルではエラー。
// - 引用符内（属性セレクタの文字列値）はどちらも置換しない。
function resolveSelector(selector: string, self: string, parent?: string): string {
    let out = "";
    let quote: '"' | "'" | null = null;
    for (let i = 0; i < selector.length; i++) {
        const c = selector[i];
        if (quote) {
            out += c;
            if (c === quote && selector[i - 1] !== "\\") quote = null;
            continue;
        }
        if (c === '"' || c === "'") {
            quote = c;
            out += c;
        } else if (c === "$" && selector[i + 1] !== "=") {
            out += self;
        } else if (c === "&") {
            if (parent === undefined) {
                throw new Error(`cirro: "&" is not allowed in a top-level selector ("${selector}"). Use "$" to refer to the generated class itself.`);
            }
            out += parent;
        } else {
            out += c;
        }
    }
    return out;
}

// セレクタ・アットルールの検証。値は開発者が書くものだが、補間された値の事故や
// ブロック注入（"x } .evil {" のような波括弧の混入）をビルド時に確実に弾く。
function validateSelector(selector: string): void {
    if (selector.length > 512) throw new Error(`cirro: selector "${selector}" is too long(max 512 characters)`);
    if (/[{};]/.test(selector) || selector.includes("/*")) {
        throw new Error(`cirro: selector "${selector}" contains a forbidden sequence ("{", "}", ";" or "/*")`);
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
