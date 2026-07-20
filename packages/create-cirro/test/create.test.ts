import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import { createProject } from "../src/create.js";

const templateDir = fileURLToPath(new URL("../template", import.meta.url));
const cleanups: string[] = [];

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
