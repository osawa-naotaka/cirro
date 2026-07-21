import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { cleanUrlPath, collectLinks, collectSiteLinks, listPublicFiles } from "../src/runtime/link.ts";
import type { ResolvedPath } from "../src/runtime/router.ts";

function html(path: string): ResolvedPath {
    return { type: "html", path, render: () => ({}) as never };
}

describe("cleanUrlPath", () => {
    test.each([
        ["root index", "/index.html", "/"],
        ["root index (.htm)", "/index.htm", "/"],
        ["nested index", "/path/to/index.html", "/path/to/"],
        ["extension-less form of a page", "/path/about.html", "/path/about"],
        ["top level page", "/about.html", "/about"],
        [".htm page", "/about.htm", "/about"],
        ["file route is left as-is", "/feed.xml", "/feed.xml"],
        ["extension-less path is left as-is", "/robots", "/robots"],
    ])("normalizes %s", (_name, path, expected) => {
        expect(cleanUrlPath(path)).toBe(expected);
    });
});

describe("collectLinks", () => {
    // 1 つの出力 path に対して、実際に配信で解決される複数の綴りを登録する
    // （09_LINK_SAFETY.md 4.4）。ここが欠けるとリンク検証が偽陽性を出す。
    test.each([
        ["root index", "/index.html", ["/index.html", "/"]],
        ["nested index", "/path/to/index.html", ["/path/to/index.html", "/path/to", "/path/to/"]],
        ["nested index (.htm)", "/path/to/index.htm", ["/path/to/index.htm", "/path/to", "/path/to/"]],
        ["top level page", "/about.html", ["/about.html", "/about"]],
        [".htm page", "/about.htm", ["/about.htm", "/about"]],
        ["nested page", "/blog/hello.html", ["/blog/hello.html", "/blog/hello"]],
        ["file route", "/feed.xml", ["/feed.xml"]],
        ["extension-less asset", "/robots", ["/robots"]],
    ])("registers every spelling of %s", (_name, path, expected) => {
        expect([...collectLinks([path])].sort()).toEqual([...expected].sort());
    });

    test("decodes percent-encoded paths so that decoded links match", () => {
        expect([...collectLinks(["/%E3%81%82.html"])].sort()).toEqual(["/あ", "/あ.html"]);
    });

    test("keeps an already-decoded path as-is", () => {
        expect(collectLinks(["/あ.html"]).has("/あ")).toBe(true);
    });

    test("warns and skips a path with an invalid percent-encoding instead of throwing", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const links = collectLinks(["/%E0%A4%A.html", "/ok.html"]);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(links.has("/ok")).toBe(true);
        expect(links.has("/%E0%A4%A.html")).toBe(false);
        warn.mockRestore();
    });

    test("adds to the given initial set and returns it", () => {
        const initial = new Set(["/preexisting"]);
        const links = collectLinks(["/about.html"], initial);
        expect(links).toBe(initial);
        expect(links.has("/preexisting")).toBe(true);
        expect(links.has("/about")).toBe(true);
    });

    test("returns an empty set for no paths", () => {
        expect(collectLinks([]).size).toBe(0);
    });

    test("deduplicates spellings shared by several pages", () => {
        // /a/index.html と /a.html はどちらも "/a" を生む。
        expect([...collectLinks(["/a/index.html", "/a.html"])].sort()).toEqual(["/a", "/a.html", "/a/", "/a/index.html"]);
    });
});

describe("listPublicFiles / collectSiteLinks", () => {
    let publicDir: string;

    beforeAll(() => {
        publicDir = mkdtempSync(join(tmpdir(), "cirro-public-"));
        mkdirSync(join(publicDir, "images"), { recursive: true });
        mkdirSync(join(publicDir, "empty"), { recursive: true });
        writeFileSync(join(publicDir, "favicon.ico"), "");
        writeFileSync(join(publicDir, "images", "logo.png"), "");
    });

    afterAll(() => {
        rmSync(publicDir, { recursive: true, force: true });
    });

    test("lists files recursively as root-relative delivery paths", () => {
        expect(listPublicFiles(publicDir).sort()).toEqual(["/favicon.ico", "/images/logo.png"]);
    });

    test("omits directories from the listing", () => {
        expect(listPublicFiles(publicDir)).not.toContain("/empty");
    });

    test.each([
        ["publicDir disabled", false as const],
        ["empty path", ""],
        ["non-existent path", join(tmpdir(), "cirro-public-nosuch")],
    ])("returns nothing for %s", (_name, path) => {
        expect(listPublicFiles(path)).toEqual([]);
    });

    test("merges page spellings and public files into one link set", () => {
        const links = collectSiteLinks([html("/index.html"), html("/blog/hello.html")], publicDir);
        expect([...links].sort()).toEqual(["/", "/blog/hello", "/blog/hello.html", "/favicon.ico", "/images/logo.png", "/index.html"]);
    });

    test("works without a public directory", () => {
        expect([...collectSiteLinks([html("/about.html")], false)].sort()).toEqual(["/about", "/about.html"]);
    });
});
