import { defineConfig } from "vitest/config";

// カバレッジ計測の設計は 15_TESTING.md 9 章を参照。
// ここで測るのは「テストプロセス内で import される層」のみ（層 A）。
// 子プロセス（cirro build）でしか走らない層 B は NODE_V8_COVERAGE 側で別途測る。
export default defineConfig({
    test: {
        coverage: {
            // v8 provider。Vitest 4 では AST ベースの remap が既定のため、
            // 分岐精度のために istanbul を選ぶ理由はない（計装が不要な分こちらが速い）。
            provider: "v8",

            // include を明示しないと「どのテストからも import されないファイル」がレポートから
            // 消える（0% が見えない）。穴を可視化することが目的なので必ず指定する。
            include: ["src/**/*.{ts,tsx}"],

            exclude: [
                // 子プロセス（cirro build）でしか実行されない。層 A では常に 0% になり、
                // 測れていないことを「カバーされていない」と誤読させるため層 B に委ねる。
                "src/runtime/build.ts",
                "src/runtime/cli.ts",
                "src/runtime/dev.ts",

                // 生成物（script/genFontAwesomeDefs.ts）。数千行のアイコン定義が
                // 100% 側に積み上がり、全体の率を無意味に押し上げる。
                "src/lib/fontawesome-brands.ts",
                "src/lib/fontawesome-regular.ts",
                "src/lib/fontawesome-solid.ts",

                // ブラウザ解決専用のエントリ（package.json exports の browser 条件）。
                // node 環境のテストからは到達しない。
                "src/registry/registry.browser.ts",
            ],

            // json は将来の層 B とのマージ用（15_TESTING.md 9 章）。
            reporter: ["text", "html", "json"],
        },
    },
});
