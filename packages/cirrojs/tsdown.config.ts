import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        server: "src/server.ts",
        vite: "src/vite.ts",
        cli: "src/cli.ts",
    },
    format: ["esm"],
    platform: "node",
    target: "esnext",
    tsconfig: "tsconfig.build.json",
    dts: true,
    minify: true,
    clean: true,
    // 出力拡張子を .js / .d.ts に固定（publishConfig.exports と揃える）。
    fixedExtension: false,
    // public/ 配下（bin ランチャー cli.sh を含む）を dist/ 直下へコピーする。
    copy: [{ from: "public/cli.sh", to: "dist" }],
});
