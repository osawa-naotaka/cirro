#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { createProject } from "../src/create.js";

const targetDir = process.argv[2];

if (!targetDir) {
    console.error("Usage: pnpm create cirro <directory>");
    console.error("Example: pnpm create cirro my-site");
    process.exit(1);
}

const templateDir = fileURLToPath(new URL("../template", import.meta.url));

try {
    const { projectName, target } = createProject(targetDir, templateDir);
    console.log(`Created a new Cirro site "${projectName}" at ${target}`);
    console.log("");
    console.log("Next steps:");
    console.log(`  cd ${targetDir}`);
    console.log("  pnpm install");
    console.log("  pnpm dev");
} catch (err) {
    console.error(`create-cirro: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
}
