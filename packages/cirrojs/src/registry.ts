import type { Properties } from "./properties";

export type Registry = [string[], Partial<Properties>][];

let registry: Registry = [];

export function registerCss(selectors: string[], properties: Partial<Properties>) {
    registry.push([selectors, properties]);
}

export function initCssRegistry() {
    registry = [];
}

export function getCssRegistry(): Registry {
    return registry;
}
