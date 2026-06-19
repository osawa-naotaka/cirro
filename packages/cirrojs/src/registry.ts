import type { Properties } from "./properties";

export type Registry = Map<string, [string[], Partial<Properties>]>;

const registry: Registry = new Map();

export function registerCss(designator: string, selectors: string[], properties: Partial<Properties>) {
    registry.set(designator, [selectors, properties]);
}

export function initCssRegistry() {
    registry.clear();
}

export function getCssRegistry(): Registry {
    return registry;
}
