import { execFile } from "node:child_process";
import { access, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const cli = join(packageRoot, "public", "cli.sh");
const fixtures = join(packageRoot, "test", "fixtures");

const BUILD_TIMEOUT = 180_000;

type BuildResult = { code: number; output: string };

// 実際の CLI 経路（cli.sh → runtime）でフィクスチャをビルドする。--node で実行 runtime を
// 固定し、bun の有無で結果が変わらないようにする。終了コードは throw させず値で受け取る。
async function build(fixture: string): Promise<BuildResult> {
    const cwd = join(fixtures, fixture);
    await rm(join(cwd, "dist"), { recursive: true, force: true });
    try {
        const { stdout, stderr } = await execFileAsync("bash", [cli, "build", "--node"], { cwd });
        return { code: 0, output: stdout + stderr };
    } catch (e) {
        const err = e as { code?: number; stdout?: string; stderr?: string };
        return { code: typeof err.code === "number" ? err.code : 1, output: (err.stdout ?? "") + (err.stderr ?? "") };
    }
}

function exists(path: string): Promise<boolean> {
    return access(path).then(
        () => true,
        () => false,
    );
}

// 対照群。違反ゼロのサイトが 0 で終わることを先に固定しないと、以下の非ゼロが
// 「フィクスチャの配線ミスで落ちているだけ」と区別できない（空振り防止）。
describe("fixtures/valid", () => {
    let result: BuildResult;

    beforeAll(async () => {
        result = await build("valid");
    }, BUILD_TIMEOUT);

    test("exits with code 0", () => {
        expect(result.code).toBe(0);
    });

    test("reports that no violation was found", () => {
        expect(result.output).toContain("no route, link, image, island, or site errors found");
    });

    test("writes the html output", async () => {
        expect(await exists(join(fixtures, "valid", "dist", "index.html"))).toBe(true);
        expect(await exists(join(fixtures, "valid", "dist", "about.html"))).toBe(true);
    });
});

// 描画中に収集される違反（14_CONFIG_VALIDATION.md 4.2 の統合レール）。
describe("fixtures/broken-refs", () => {
    let result: BuildResult;

    beforeAll(async () => {
        result = await build("broken-refs");
    }, BUILD_TIMEOUT);

    test("exits with a non-zero code", () => {
        expect(result.code).not.toBe(0);
    });

    test("names the page the violations occurred on", () => {
        expect(result.output).toContain("errors in /index.html:");
    });

    test.each([
        ["broken link (not-found)", 'Link is not found: "/nope".'],
        ["broken link (malformed)", 'Link is malformed: "//evil.example.com".'],
        ["broken image (not-found)", 'Image is not found: "/images/nope.png".'],
        ["broken image (malformed)", 'Image is malformed: "./relative.png".'],
        ["island not-configured", 'Island "counter" was rendered but the islands option is not set'],
        ["island props", 'Island "counter": props.onPick is not JSON-serializable (function)'],
        ["missing site", "Site metadata is required by pageUrl() but is not declared."],
        ["markdown ref (not-found)", 'Markdown href="/nope-md" is not found on this site.'],
        ["markdown ref (malformed)", 'Markdown src="./rel.png" is malformed.'],
    ])("reports %s", (_name, message) => {
        expect(result.output).toContain(message);
    });

    test("reports every violation in one pass instead of stopping at the first", () => {
        // 全件収集・一括報告の方針（09_LINK_SAFETY.md 4.5）が build まで通っていること。
        const reported = result.output.slice(result.output.indexOf("errors in /index.html:"));
        expect(reported.split("\n").filter((l) => l.trim().length > 0).length).toBeGreaterThanOrEqual(9);
    });

    test("still writes the output (the build reports rather than aborts)", async () => {
        expect(await exists(join(fixtures, "broken-refs", "dist", "index.html"))).toBe(true);
    });
});

// ルート展開後に検出される違反（14_CONFIG_VALIDATION.md 4.2 の検査点②）。
describe("fixtures/broken-routes", () => {
    let result: BuildResult;

    beforeAll(async () => {
        result = await build("broken-routes");
    }, BUILD_TIMEOUT);

    test("exits with a non-zero code", () => {
        expect(result.code).not.toBe(0);
    });

    test.each([
        ["malformed path", 'Route error (malformed-path) at "/about"'],
        ["duplicate output path", 'Route error (duplicate-path) at "/posts/dup.html"'],
        ["collision with a public file", 'Route error (public-collision) at "/collide.html"'],
    ])("reports a %s", (_name, message) => {
        expect(result.output).toContain(message);
    });

    test("reports the collision on the clean URL spelling as well", () => {
        // dev と build で勝者が変わりうるのは配信される全ての綴りなので、両方報告する。
        expect(result.output).toContain('Route error (public-collision) at "/collide"');
    });

    test("does not claim that no error was found", () => {
        expect(result.output).not.toContain("no route, link, image, island, or site errors found");
    });
});
