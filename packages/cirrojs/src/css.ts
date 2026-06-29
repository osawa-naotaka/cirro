// registerCss はランタイム値なので自己参照 import 経由で解決する。
// これにより exports の browser 条件が効き、クライアントでは async_hooks 非依存の
// no-op 実装（registry.browser.ts）に差し替わる。型は erase される import type で real から取得する。
import { registerCss } from "cirrojs/registry";
import { type Properties, property_names } from "./properties.ts";
import type { Registry } from "./registry.ts";

export type CssOpt = {
    name?: string;
    atrules?: string[];
    selector?: string;
};

export function css(properties: Properties, opt?: CssOpt): string {
    const selector = opt?.selector ?? "&";
    const atrules = opt?.atrules ?? [];

    const hash = hash_djb2_object({ selector, atrules, properties });
    const designator = `${opt?.name ?? "cirro"}-${hash.toString(16)}`;

    cssWithSelector([...atrules, selector], properties, designator);
    return designator;
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
    let css = '@charset "utf-8";\n@layer base, font, low, main, high;\n';
    for (const [_keys, [selectors, properties]] of registry) {
        css += selectors.reduceRight(
            (p, c) => {
                if (c.length > 512) throw new Error(`At rule or selector "${c}" is too long(max 512 characters)`);
                return `${c} { ${p} }`;
            },
            Object.entries(properties)
                .map(([k, v]) => stringifyProperty(k, v))
                .join(" "),
        );
        css += `\n`;
    }
    return css;
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

function cssWithSelector(selectors: string[], properties: Properties, designator: string): void {
    const replaceAnd = selectors.map((x) => x.replaceAll("&", `.${designator}`));
    registerCss(designator, replaceAnd, properties);
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
