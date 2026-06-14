#!/usr/bin/env bun
import { runBuild } from "./runtime/build.js";
import { runDev } from "./runtime/dev.js";

const cmd = process.argv[2];

if (cmd === "dev") {
    await runDev();
} else if (cmd === "build") {
    await runBuild();
} else {
    console.error("usage: cirro <dev|build>");
    process.exit(1);
}
