import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/index.ts",
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
    // public/ を dist/ へコピーする（bin ランチャー cli.sh を含む）。
    publicDir: true,
});
