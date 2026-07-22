// 層 B のカバレッジ採取（15_TESTING.md 9 章）。
//
// csp.test.ts / build-failure.test.ts は cirro build を子プロセスで走らせるため、Vitest の
// カバレッジからは見えない。ここでは NODE_V8_COVERAGE で子プロセスに生の V8 カバレッジを
// dump させ、それを c8 でレポートへ変換する。
//
//     node script/coverageRuntime.ts   (pnpm test:coverage:runtime)

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const rawDir = join(packageRoot, "coverage-runtime", ".v8-raw");
const usableDir = join(packageRoot, "coverage-runtime", ".v8-usable");
const reportDir = join(packageRoot, "coverage-runtime");

// 子プロセスでしか走らないコードを通すテストだけを対象にする。
const TESTS = ["test/csp.test.ts", "test/build-failure.test.ts"];

// 層 A（vitest --coverage）が測れない範囲。それ以外は層 A の担当なので二重には出さない。
const INCLUDE = ["src/runtime/**", "src/vite/**"];

function run(): void {
    rmSync(reportDir, { recursive: true, force: true });
    mkdirSync(rawDir, { recursive: true });
    mkdirSync(usableDir, { recursive: true });

    console.log(`collecting v8 coverage from ${TESTS.join(", ")}`);
    execFileSync("pnpm", ["exec", "vitest", "run", ...TESTS], {
        cwd: packageRoot,
        env: { ...process.env, CIRRO_COV_DIR: rawDir },
        stdio: "inherit",
    });

    const { dumps, kept, dropped } = filterDumps();
    if (kept === 0) {
        throw new Error(`cirro: no usable v8 coverage was collected into ${rawDir} (did the child builds run?)`);
    }
    console.log(`\n${dumps} dump(s): kept ${kept} script(s) loaded from disk, dropped ${dropped} transformed by vite`);

    execFileSync(
        "pnpm",
        [
            "exec",
            "c8",
            "report",
            `--temp-directory=${usableDir}`,
            `--reports-dir=${reportDir}`,
            ...INCLUDE.map((i) => `--include=${i}`),
            "--reporter=text",
            "--reporter=html",
            "--reporter=json",
        ],
        { cwd: packageRoot, stdio: "inherit" },
    );
}

// dump には 2 種類のエントリが混ざる。
//
// - file:// で始まる URL: Node が disk からロードしたモジュール。Node の型ストリッピングは
//   型注釈を空白に置換して文字位置を保存するため、.ts 原本にソースマップ無しで 1:1 対応する。
// - スキーム無しの絶対パス: Vite の ssrLoadModule が vm で評価したモジュール。**変換後コードの
//   オフセット**を持つため、同じファイルについて file:// 版と食い違う。混ぜると行の帰属が壊れる。
//
// 後者を捨てても損失は無い（src/lib 等は層 A が正面から測る）。
function filterDumps(): { dumps: number; kept: number; dropped: number } {
    let dumps = 0;
    let kept = 0;
    let dropped = 0;

    for (const name of readdirSync(rawDir)) {
        if (!name.endsWith(".json")) continue;
        const dump = JSON.parse(readFileSync(join(rawDir, name), "utf-8")) as { result: { url: string }[] };
        const before = dump.result.length;
        dump.result = dump.result.filter((r) => r.url.startsWith("file://") && !r.url.includes("/node_modules/"));
        dumps++;
        kept += dump.result.length;
        dropped += before - dump.result.length;
        writeFileSync(join(usableDir, name), JSON.stringify(dump));
    }

    return { dumps, kept, dropped };
}

run();
