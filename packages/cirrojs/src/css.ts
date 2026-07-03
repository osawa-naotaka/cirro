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

    const resolved = resolveSelectorsInNode(node, `.${designator}`);
    registerRules(designator, [resolved]);

    return designator;
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
// $= の混入は validateTopSelector が事前に拒否する。引用文字列内に $ を書けない制約は
// doc に明記済み（将来セレクタパーサー導入時に緩和予定）。
function resolveSelector(selector: string, self: string): string {
    return selector.replaceAll("$", self);
}

function resolveSelectorsInNode(node: RuleNode, designator: string): RuleNode {
    switch (node.type) {
        case "style":
            return {
                ...node,
                selector: resolveSelector(node.selector, designator),
                children: node.children?.map((child) => resolveSelectorsInNode(child, designator)),
            };
        case "at-statement":
            return node;
        case "at-block":
            return { ...node, children: node.children.map((child) => resolveSelectorsInNode(child, designator)) };
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
