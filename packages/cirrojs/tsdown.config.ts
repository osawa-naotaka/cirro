import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        server: "src/server.ts",
        vite: "src/vite.ts",
        cli: "src/cli.ts",
        layout: "src/layout.tsx",
        // registry は browser/node を exports 条件で切り替えるため、別ファイルとして出力する。
        registry: "src/registry.ts",
        "registry.browser": "src/registry.browser.ts",
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
