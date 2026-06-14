import type { ResolvedConfig } from "vite";
import type { CirroOptions } from "../vite";

// 解決済み Vite config から cirro プラグインのオプションを取り出す。
// cirro() プラグインが `api: { options }` で公開している。
export function getCirroOptions(config: ResolvedConfig): CirroOptions {
    for (const p of config.plugins) {
        const api = p.api as { options?: CirroOptions } | undefined;
        if (p.name === "cirro" && api?.options) return api.options;
    }
    throw new Error("cirro: plugin not found in Vite config (did you add cirro() to plugins?)");
}
