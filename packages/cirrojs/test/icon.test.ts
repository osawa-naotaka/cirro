import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { faDir } from "../src/lib/fontawesome.ts";
import { createRegistry } from "../src/registry/registry.common.ts";
import { bundleIcon, loadSprite } from "../src/runtime/icon.ts";
import { scanMarkup } from "./scan.ts";

describe("loadSprite", () => {
    test.each(["brands", "regular", "solid"])("strips the root style attribute from the %s sprite", (type) => {
        // FA のスプライトはルート <svg> に style="display: none;" を持つ。配信物に
        // インラインスタイルを残さないため除去する（10_IMAGE_ASSETS.md 5.7）。
        expect(loadSprite(type)).not.toContain("style=");
    });

    test.each(["brands", "regular", "solid"])("keeps the symbol definitions of the %s sprite", (type) => {
        const svg = loadSprite(type);
        expect(svg).toContain("<svg");
        expect(svg).toContain("<symbol");
        expect(svg).toContain("<path");
    });

    test("produces markup with zero CSP violations", () => {
        // csp.test.ts が dist の .svg に対して行う走査と同じ基準を、供給元でも押さえる。
        expect(scanMarkup(loadSprite("solid"), "solid.svg")).toEqual([]);
    });

    test("throws for an unknown sprite type", () => {
        expect(() => loadSprite("nosuch")).toThrow();
    });

    test("is deterministic", () => {
        expect(loadSprite("brands")).toBe(loadSprite("brands"));
    });
});

describe("bundleIcon", () => {
    let outDir: string;

    beforeAll(() => {
        outDir = mkdtempSync(join(tmpdir(), "cirro-icon-"));
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterAll(() => {
        rmSync(outDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    test("writes only the sprites of the icon types actually used", () => {
        const registry = createRegistry();
        registry.icon.add("solid/house");
        registry.icon.add("solid/user");
        registry.icon.add("brands/github");

        bundleIcon(registry, outDir);

        expect(readdirSync(join(outDir, faDir)).sort()).toEqual(["brands.svg", "solid.svg"]);
        expect(readFileSync(join(outDir, faDir, "solid.svg"), "utf-8")).toBe(loadSprite("solid"));
    });

    test("writes nothing when no icon is used", () => {
        const empty = mkdtempSync(join(tmpdir(), "cirro-icon-"));
        bundleIcon(createRegistry(), empty);
        expect(readdirSync(empty)).toEqual([]);
        rmSync(empty, { recursive: true, force: true });
    });
});
