import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        index: "src/lib/index.ts",
        server: "src/server/server.ts",
        vite: "src/vite/vite.ts",
        cli: "src/runtime/cli.ts",
        layout: "src/layout/layout.tsx",
        // registry は browser/node を exports 条件で切り替えるため、別ファイルとして出力する。
        registry: "src/registry/registry.ts",
        "registry.browser": "src/registry/registry.browser.ts",
    },
    format: ["esm"],
    platform: "node",
    target: "esnext",
    tsconfig: "tsconfig.json",
    dts: true,
    minify: true,
    clean: true,
    // 自己参照 import（css.ts / index.ts の "cirrojs/registry"）は dist へインライン化せず
    // ランタイム import のまま残し、利用者ビルド側で browser/node 条件に解決させる。
    deps: { neverBundle: ["cirrojs/registry"] },
    // 出力拡張子を .js / .d.ts に固定（publishConfig.exports と揃える）。
    fixedExtension: false,
    // public/ 配下（bin ランチャー cli.sh を含む）を dist/ 直下へコピーする。
    copy: [{ from: "public/cli.sh", to: "dist" }],
});
