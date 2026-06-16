
import type { Properties } from "./properties";
import { registerCss } from "./registry";

export function css(properties: Properties, name?: string): string {
    const hash = hash_djb2_object(properties);
    const className = `${name ?? "cirro"}-${hash.toString(16)}`
    registerCss(className, properties)
    return className;
}

export function cssWithSelector(selector: string, properties: Properties): void {
    registerCss(selector, properties);
}

export function hash_djb2_object(...jsons: Record<string, unknown>[]): number {
    const chars = jsons.map((x) => JSON.stringify(x)).join("");
    return hash_djb2(chars);
}

export function hash_djb2(s: string): number {
    let hash = 5381;
    for (const char of [...s]) {
        hash = ((hash << 5) + hash + char.charCodeAt(0)) & 0xffffffff;
    }
    return hash >>> 0;
}
