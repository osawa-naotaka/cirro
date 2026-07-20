import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

// スキャフォールディングの本体（16_SCAFFOLDING.md 4.2）。テンプレートを targetDir へコピーし、
// _package.json → package.json（{{PROJECT_NAME}} 置換）・_gitignore → .gitignore にリネームする。
// 失敗はすべて throw（bin 側がメッセージを表示して非ゼロ終了する）。
export function createProject(targetDir, templateDir) {
    const target = resolve(targetDir);
    const projectName = basename(target);

    if (!/^[a-z0-9][a-z0-9._-]*$/.test(projectName)) {
        throw new Error(`invalid project name "${projectName}": use lowercase letters, digits, "-", ".", "_" (it becomes the npm package name)`);
    }
    if (existsSync(target) && readdirSync(target).length > 0) {
        throw new Error(`target directory is not empty: ${target}`);
    }

    mkdirSync(target, { recursive: true });
    cpSync(templateDir, target, { recursive: true });

    const pkgTemplatePath = join(target, "_package.json");
    const pkg = readFileSync(pkgTemplatePath, "utf-8").replaceAll("{{PROJECT_NAME}}", projectName);
    writeFileSync(join(target, "package.json"), pkg);
    rmSync(pkgTemplatePath);
    renameSync(join(target, "_gitignore"), join(target, ".gitignore"));

    return { projectName, target };
}
