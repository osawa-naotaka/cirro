// registerRules はランタイム値なので自己参照 import 経由で解決する。
// これにより exports の browser 条件が効き、クライアントでは async_hooks 非依存の
// no-op 実装（registry.browser.ts）に差し替わる。型は erase される import type で real から取得する。
import { registerRules } from "cirrojs/registry";
import { type Properties, property_names } from "./properties.ts";
import type { Registry, RuleNode } from "./registry.ts";

export type CssFnOpt = {
    name?: string;
    selector?: string;
};

export type CssFn = (properties: Properties, opt?: CssFnOpt, ...children: RuleNode[]) => string;
export type InjectFn = (injected: () => RuleNode) => RuleNode;

export function genCssFn(arg: InjectFn): CssFn {
    return (properties: Properties, opt?: CssFnOpt, ...children: RuleNode[]) => {
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
    };
}

export function at(prelude: string, ...children: RuleNode[]): RuleNode {
    return {
        type: "at-block",
        prelude,
        children,
    };
}

export function atStatement(statement: string): RuleNode {
    return {
        type: "at-statement",
        statement,
    };
}

export type ToStyleOpt = {
    name?: string;
};

export function toStyle(node: RuleNode, opt?: ToStyleOpt): string {
    const hash = hash_djb2_object(node);
    const designator = `${opt?.name ?? "cirro"}-${hash.toString(16)}`;

    const resolved = resolveSelectorsInNode(node, `.${designator}`, false);
    registerRules(designator, [resolved]);

    return designator;
}

export type ToKeyframesOpt = {
    name?: string;
    wrap?: InjectFn;
};

const keyframe_selector_re = /^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/;

// @keyframes を登録し、アニメーション名（animation / animation-name に渡す文字列）を返す。
// 名前はフレーム内容から決まる決定的ハッシュ（既定接頭辞 "cirro-kf"）で、クラス名ではない。
// wrap（genCssFn と同じ InjectFn 形式）で @layer などの外側アットルールに包める。
// 同一フレーム内容は同一名になり、レジストリ上で自然に重複排除される。wrap はハッシュに
// 含まれないため、同一内容を異なる wrap で複数回登録した場合は最後の 1 件だけが出力される。
export function toKeyframes(frames: RuleNode[], opt?: ToKeyframesOpt): string {
    for (const frame of frames) {
        if (frame.type !== "style") {
            throw new Error(`cirro: @keyframes accepts only style rules (got "${frame.type}")`);
        }
        if (!keyframe_selector_re.test(frame.selector)) {
            throw new Error(`cirro: keyframe selector "${frame.selector}" must be "from", "to", "<number>%" or a comma-separated list of them`);
        }
        if (frame.children && frame.children.length > 0) {
            throw new Error(`cirro: keyframe "${frame.selector}" must not contain nested rules`);
        }
    }

    const hash = hash_djb2_object({ frames });
    const name = `${opt?.name ?? "cirro-kf"}-${hash.toString(16)}`;

    const block = at(`@keyframes ${name}`, ...frames);
    registerRules(name, [opt?.wrap ? opt.wrap(() => block) : block]);
    return name;
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

// "$"（自クラス参照）を機械的に全置換する。引用符やエスケープの解釈は行わない。
// $= の混入や不正な位置の $ / & は resolveSelectorsInNode が登録時に拒否する。
// 引用文字列内に $ を書けない制約は doc に明記済み（将来セレクタパーサー導入時に緩和予定）。
function resolveSelector(selector: string, self: string): string {
    return selector.replaceAll("$", self);
}

// $ と & は使える位置が異なるため、スタイルルールへの入れ子か否か（insideStyle）で検証を分ける。
// - 入れ子でないセレクタ: $ を置換する。& は親が存在せず :scope 扱いになり意図とズレるためエラー。
//   $= は機械置換で属性後方一致が壊れるためエラー。
// - 入れ子のセレクタ: & はブラウザの CSS ネストに委ねてそのまま通す。$ は置換結果が & を含まず
//   暗黙の子孫結合が働き「ルート参照のつもりが子孫セレクタ」という無言のズレになるためエラー。
// 検証を stringify 時でなく登録時に行うことで、エラーの stack が登録元（コンポーネント）を指す。
function resolveSelectorsInNode(node: RuleNode, designator: string, insideStyle: boolean): RuleNode {
    switch (node.type) {
        case "style": {
            if (insideStyle) {
                if (node.selector.includes("$")) {
                    throw new Error(
                        `cirro: "$" is not allowed in a nested selector ("${node.selector}"). ` +
                            `Specify the selector explicitly and use "&" to refer to the parent inside nested rules.`,
                    );
                }
            } else {
                if (node.selector.includes("&")) {
                    throw new Error(
                        `cirro: "&" is not allowed in a non-nested selector ("${node.selector}"). ` +
                            `"&" is the CSS Nesting parent reference; use "$" to refer to the generated class itself.`,
                    );
                }
                if (node.selector.includes("$=")) {
                    throw new Error(
                        `cirro: the attribute suffix matcher ("$=") is not supported in "${node.selector}" ` +
                            `because every "$" is replaced with the generated class name`,
                    );
                }
            }
            return {
                ...node,
                selector: insideStyle ? node.selector : resolveSelector(node.selector, designator),
                children: node.children?.map((child) => resolveSelectorsInNode(child, designator, true)),
            };
        }
        case "at-statement":
            return node;
        case "at-block":
            return { ...node, children: node.children.map((child) => resolveSelectorsInNode(child, designator, insideStyle)) };
    }
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

function validatePropertyName(name: string): boolean {
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
