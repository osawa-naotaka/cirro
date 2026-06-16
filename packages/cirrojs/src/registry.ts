import type { Properties } from "./properties";

const registry = new Map <string, Partial<Properties>>();

export function registerCss(name: string, properties: Partial<Properties>) {
    registry.set(name, properties);
}

export function initCssRegistry() {
    registry.clear();
}

export function getCssRegistry(): Map<string, Partial<Properties>> {
    return registry;
}
