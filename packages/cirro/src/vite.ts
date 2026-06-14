import { resolve } from "node:path";
import type { Plugin } from "vite";

export type CirroOptions = {
    routes: string;
    islands: string;
};

const VIRTUAL_CLIENT = "virtual:cirro/client";
const RESOLVED_CLIENT = `\0${VIRTUAL_CLIENT}`;

// cirro の Vite プラグイン。
// - CSP 厳格な build 設定を注入（manifest・modulePreload polyfill 無効・inline 無効）
// - 島マウンタを仮想モジュール virtual:cirro/client として提供（利用者は client.tsx を書かない）
//
// React プラグイン（@vitejs/plugin-react）は内包しない。利用者が plugins に react() を
// 明示的に追加する（RSC 系プラグインと同じ作法）。未追加の場合は configResolved で検出して案内する。
export function cirro(options: CirroOptions): Plugin {
    let islandsPath = options.islands;
    return {
        name: "cirro",
        // CLI (cirro dev / build) が解決済み config から routes/islands を取得するために公開する。
        api: { options },
        config() {
            return {
                build: {
                    manifest: true,
                    modulePreload: { polyfill: false },
                    assetsInlineLimit: 0,
                    rollupOptions: { input: { client: VIRTUAL_CLIENT } },
                },
            };
        },
        configResolved(resolved) {
            islandsPath = resolve(resolved.root, options.islands);
            // @vitejs/plugin-react は内部で vite:react-* というプラグインを登録する。未追加なら案内する。
            const hasReact = resolved.plugins.some((p) => p.name?.startsWith("vite:react"));
            if (!hasReact) {
                throw new Error("cirro: React プラグインが見つかりません。vite.config の plugins に react()（@vitejs/plugin-react）を cirro() より前に追加してください。");
            }
        },
        resolveId(id) {
            if (id === VIRTUAL_CLIENT) return RESOLVED_CLIENT;
        },
        load(id) {
            if (id === RESOLVED_CLIENT) {
                // 島マウンタ: data-island を走査し、純データ registry から島を解決して hydrate する。
                return [
                    `import { createElement } from "react";`,
                    `import { hydrateRoot } from "react-dom/client";`,
                    `import { islands } from ${JSON.stringify(islandsPath)};`,
                    ``,
                    `for (const el of document.querySelectorAll("[data-island]")) {`,
                    `    const name = el.dataset.island;`,
                    `    if (!name || !(name in islands)) continue;`,
                    `    const props = el.dataset.props ? JSON.parse(el.dataset.props) : {};`,
                    `    hydrateRoot(el, createElement(islands[name], props));`,
                    `}`,
                ].join("\n");
            }
        },
    };
}
