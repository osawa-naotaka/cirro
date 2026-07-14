import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { faDir } from "../lib/fontawesome.ts";
import type { Registry } from "../registry/registry.common.ts";

export function bundleIcon(registry: Registry, outDir: string): void {
    const types = new Set(registry.icon.values().map((e) => e.split("/")[0]));

    for (const t of types) {
        const require = createRequire(import.meta.url);
        const path = require.resolve(`@fortawesome/fontawesome-free/sprites/${t}.svg`);
        const url = join(faDir, `${t}.svg`);
        const filePath = join(outDir, url);
        
        mkdirSync(dirname(filePath), { recursive: true });
        copyFileSync(path, filePath);
        console.log(`wrote ${filePath} (url: ${url})`);
    }
}
