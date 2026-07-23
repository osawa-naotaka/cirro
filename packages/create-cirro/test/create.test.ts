import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import { createProject } from "../src/create.js";

const templateDir = fileURLToPath(new URL("../template", import.meta.url));
const exampleSrcDir = fileURLToPath(new URL("../../../examples/basic/src", import.meta.url));
const cleanups: string[] = [];

// dir 以下の全ファイルを、dir からの相対パスでソートして返す（再帰）。
function listFiles(dir: string, base: string = dir): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files = entries.flatMap((e) => (e.isDirectory() ? listFiles(join(dir, e.name), base) : [relative(base, join(dir, e.name))]));
    return files.sort();
}

function tmpBase(): string {
    const dir = mkdtempSync(join(tmpdir(), "create-cirro-test-"));
    cleanups.push(dir);
    return dir;
}

afterEach(() => {
    while (cleanups.length > 0) {
        const dir = cleanups.pop();
        if (dir) rmSync(dir, { recursive: true, force: true });
    }
});

describe("createProject", () => {
    test("copies the template and renames the underscore files", () => {
        const target = join(tmpBase(), "my-site");
        const { projectName } = createProject(target, templateDir);

        expect(projectName).toBe("my-site");
        // _prefix ファイルはリネームされて残らない
        expect(existsSync(join(target, "_package.json"))).toBe(false);
        expect(existsSync(join(target, "_gitignore"))).toBe(false);
        expect(existsSync(join(target, ".gitignore"))).toBe(true);
        // 雛形の骨格が揃っている
        for (const f of ["vite.config.ts", "tsconfig.json", "src/routes.ts", "src/islands/registry.ts", "src/islands/Island.ts", "src/pages/home.tsx"]) {
            expect(existsSync(join(target, f)), f).toBe(true);
        }
        // package.json にプロジェクト名が注入され、必須の依存を持つ
        const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf-8"));
        expect(pkg.name).toBe("my-site");
        expect(pkg.dependencies.cirrojs).toBeDefined();
        expect(pkg.scripts.dev).toBe("cirro dev");
        // routes.ts が runWithRegistry を再 export している（雛形の正しさの核）
        expect(readFileSync(join(target, "src/routes.ts"), "utf-8")).toContain('export { runWithRegistry } from "cirrojs";');
    });

    test("rejects a non-empty target directory", () => {
        const target = join(tmpBase(), "occupied");
        mkdirSync(target, { recursive: true });
        writeFileSync(join(target, "existing.txt"), "x");
        expect(() => createProject(target, templateDir)).toThrow(/not empty/);
    });

    test("rejects invalid project names", () => {
        const target = join(tmpBase(), "My Site!");
        expect(() => createProject(target, templateDir)).toThrow(/invalid project name/);
    });
});

// テンプレートは examples/basic を出発点とし、examples を直せば雛形も直る形を狙っている
// （16_SCAFFOLDING.md 2 / 4.1）。その狙いは「両者の src が同一である」ことでしか成立しないため、
// 規約を文章ではなくテストで固定する。差分が出たらどちらか一方だけを編集したということ。
describe("template/src stays in sync with examples/basic/src", () => {
    const templateSrcDir = join(templateDir, "src");

    // 空振り防止: 比較対象が消えた状態で緑にならないことを確認する。
    test("both source trees exist and are non-empty", () => {
        expect(listFiles(exampleSrcDir).length).toBeGreaterThan(0);
        expect(listFiles(templateSrcDir).length).toBeGreaterThan(0);
    });

    test("has the same file list", () => {
        expect(listFiles(templateSrcDir)).toEqual(listFiles(exampleSrcDir));
    });

    test("every file has identical content", () => {
        for (const file of listFiles(exampleSrcDir)) {
            const example = readFileSync(join(exampleSrcDir, file), "utf-8");
            const template = readFileSync(join(templateSrcDir, file), "utf-8");
            // ファイル名を assert のラベルに入れ、どれがずれたかがそのまま出るようにする。
            expect(template, `src/${file} differs between examples/basic and packages/create-cirro/template`).toBe(example);
        }
    });
});
