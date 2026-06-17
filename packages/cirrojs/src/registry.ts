import type { Properties } from "./properties";

export type Registry = [string, Partial<Properties>][];

let registry: Registry = [];

export function registerCss(name: string, properties: Partial<Properties>) {
    registry.push([name, properties]);
}

export function initCssRegistry() {
    registry = [];
}

export function getCssRegistry(): Registry {
    return registry;
}
