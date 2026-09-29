import { execFile } from "node:child_process";
import { readdir, readFile, rm } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, test } from "vitest";
import { countExternalScripts, countStylesheetLinks, scanMarkup, type Violation } from "./scan.ts";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

// example ごとに実際の CLI 経路で build し、成果物を走査する（15_TESTING.md 4.1）。
const BUILD_TIMEOUT = 180_000;

// 層 B のカバレッジ採取（15_TESTING.md 9.4）。script/coverageRuntime.ts から渡されたときだけ、
// 子プロセスの V8 カバレッジを dump させる。プロセス全体には設定しない（Vitest 自身のワーカーが
// Vite 変換後コードの dump を書き、行の帰属が壊れるため）。
const covDir = process.env.CIRRO_COV_DIR;
const buildEnv = covDir ? { ...process.env, NODE_V8_COVERAGE: covDir } : process.env;

// 検出器の自己検証: V1〜V5 の各違反を仕込んだマークアップが実際に検出されること。
// これが通らない限り「違反ゼロ」の緑に意味はない。
describe("scanMarkup detector", () => {
    const cases: { name: string; markup: string; detail: string }[] = [
        { name: "V1: inline script", markup: "<script>alert(1)</script>", detail: "inline <script> (no src attribute)" },
        { name: "V1: empty inline script", markup: "<script></script>", detail: "inline <script> (no src attribute)" },
        { name: "V2: event handler attribute", markup: '<div onclick="x()"></div>', detail: 'event handler attribute "onclick"' },
        { name: "V3: javascript: URL", markup: '<a href="jAva\tscript:alert(1)">x</a>', detail: 'javascript: URL in "href"' },
        { name: "V3: javascript: URL in svg use", markup: '<svg><use href=" javascript:alert(1)"/></svg>', detail: 'javascript: URL in "href"' },
        { name: "V4: style element", markup: "<style>body{color:red}</style>", detail: "<style> element" },
        { name: "V5: style attribute", markup: '<p style="color:red">x</p>', detail: "style attribute" },
        { name: "V1: script in svg", markup: "<svg><script>alert(1)</script></svg>", detail: "inline <script> (no src attribute)" },
        { name: "V1: script in template", markup: "<template><script>alert(1)</script></template>", detail: "inline <script> (no src attribute)" },
    ];

    test.each(cases)("detects $name", ({ markup, detail }) => {
        const violations = scanMarkup(markup, "fixture");
        expect(violations.map((v) => v.detail)).toContain(detail);
    });

    test("passes clean markup", () => {
        const clean = [
            "<!DOCTYPE html><html><head>",
            '<script async type="module" src="/assets/client.js"></script>',
            '<link rel="stylesheet" href="/assets/styles.css">',
            '</head><body><a href="/about">about</a>',
            '<svg viewBox="0 0 448 512"><use href="/fa/solid.svg#xmark"/></svg>',
            "</body></html>",
        ].join("");
        expect(scanMarkup(clean, "fixture")).toEqual([]);
        expect(countExternalScripts(clean)).toBe(1);
        expect(countStylesheetLinks(clean)).toBe(1);
    });
});

// 本体: examples をビルドし、dist の全 HTML / SVG に V1〜V5 の違反がないことを保証する。
// 3 つの example でパイプラインの主要な経路（最小・Markdown/ハイライト/FaImage・島なし）を覆う。
for (const example of ["basic", "blog"]) {
    describe(`examples/${example}`, () => {
        const exampleDir = join(repoRoot, "examples", example);
        const distDir = join(exampleDir, "dist");
        let files: string[] = [];

        beforeAll(async () => {
            await rm(distDir, { recursive: true, force: true });
            // --node で実行 runtime を固定する（build-failure.test.ts と揃える。bun の有無で
            // 結果が変わらないようにし、層 B のカバレッジ採取も node の dump 経路に乗せる）。
            await execFileAsync("pnpm", ["exec", "cirro", "build", "--node"], { cwd: exampleDir, env: buildEnv });
            const entries = await readdir(distDir, { recursive: true, withFileTypes: true });
            files = entries.filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name));
        }, BUILD_TIMEOUT);

        // 空振り防止: 走査対象が存在しない状態で緑になっていないことを確認する。
        test("has html output to scan", () => {
            expect(files.filter((f) => extname(f) === ".html").length).toBeGreaterThan(0);
        });

        test("has no inline script/style in html and svg", async () => {
            const targets = files.filter((f) => [".html", ".htm", ".svg"].includes(extname(f)));
            const violations: Violation[] = [];
            for (const f of targets) {
                violations.push(...scanMarkup(await readFile(f, "utf-8"), relative(exampleDir, f)));
            }
            expect(violations).toEqual([]);
        });

        // 空振り防止: 外部スクリプト（島マウンタ）と外部 CSS が実在することの正側の確認。
        // 「script が 1 つもない = インラインもない」という縮退で緑になっていないことを保証する。
        test("html references external script and stylesheet", async () => {
            const htmls = files.filter((f) => extname(f) === ".html");
            let scripts = 0;
            let stylesheets = 0;
            for (const f of htmls) {
                const markup = await readFile(f, "utf-8");
                scripts += countExternalScripts(markup);
                stylesheets += countStylesheetLinks(markup);
            }
            expect(scripts).toBeGreaterThan(0);
            expect(stylesheets).toBeGreaterThan(0);
        });
    });
}
