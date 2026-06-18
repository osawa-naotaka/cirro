
import type { Properties } from "./properties";
import { registerCss, type Registry } from "./registry.ts";

export type CssOpt = {
    name?: string;
    atrules?: string[];
    selector?: string;
}

export function css(properties: Properties, opt?: CssOpt): string {
    const selector = opt?.selector ?? "&";
    const atrules = opt?.atrules ?? [];

    const hash = hash_djb2_object(properties);
    const designator = `${opt?.name ?? "cirro"}-${hash.toString(16)}`

    cssWithSelector([...atrules, selector], properties, designator);
    return designator;
}

export type CssFnT = (properties: Properties, opt?: Omit<CssOpt, "atrules">) => string;

export type GenCssFnOpt = {
    mediaAtRule?: string;
    layer?: string;
}

export function genCssFn(opt: GenCssFnOpt): CssFnT {
    const atrules: string[] = [];
    if (opt.layer) atrules.push(`@layer ${opt.layer}`);
    if (opt.mediaAtRule) atrules.push(`@media (${opt.mediaAtRule})`)

    return (properties, opt) => {
      return css(properties, { atrules, name: opt?.name, selector: opt?.selector });
    }
}

export function stringifyCss(registry: Registry): string {
    let css = '@charset "utf-8";\n@layer base, font, low, main, high;\n';
    for (const [_keys, [selectors, properties]] of registry) {
        css += selectors.reduceRight((p, c) => `${c} { ${p} }`, Object.entries(properties).map(([k, v]) => `${k.replaceAll("_", "-")}: ${v};`).join(" "))
        css += `\n`;
    }
    return css;
}

function cssWithSelector(selectors: string[], properties: Properties, designator: string): void {
    const replaceAnd = selectors.map((x) => x.replaceAll("&", `.${designator}`))
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
