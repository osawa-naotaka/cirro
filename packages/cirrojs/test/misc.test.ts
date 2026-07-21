import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { defineContent } from "../src/lib/content.ts";
import { escapeXml, join } from "../src/lib/misc.ts";
import { contentType } from "../src/runtime/contentType.ts";
import { appendClientScriptAndCss } from "../src/runtime/setup.ts";
import { scanMarkup } from "./scan.ts";

describe("join", () => {
    test.each([
        ["neither side has a slash", ["https://example.com", "about"], "https://example.com/about"],
        ["the right side has one", ["https://example.com", "/about"], "https://example.com/about"],
        ["the left side has one", ["https://example.com/", "about"], "https://example.com/about"],
        ["both sides have one", ["https://example.com/", "/about"], "https://example.com/about"],
    ])("inserts exactly one separator when %s", (_name, parts, expected) => {
        expect(join(...parts)).toBe(expected);
    });

    test("joins any number of parts", () => {
        expect(join("https://example.com", "blog", "hello")).toBe("https://example.com/blog/hello");
    });

    test("keeps a trailing slash from the last part (clean URL of a directory index)", () => {
        expect(join("https://example.com", "/blog/")).toBe("https://example.com/blog/");
    });

    test("keeps the root path as a single slash", () => {
        expect(join("https://example.com", "/")).toBe("https://example.com/");
    });

    test.each([
        ["leading undefined", [undefined, "/about"], "/about"],
        ["trailing undefined", ["https://example.com", undefined], "https://example.com"],
        ["undefined in the middle", ["https://example.com", undefined, "about"], "https://example.com/about"],
    ])("skips %s", (_name, parts, expected) => {
        expect(join(...parts)).toBe(expected);
    });

    test("returns an empty string when given nothing", () => {
        expect(join()).toBe("");
        expect(join(undefined)).toBe("");
    });
});

describe("escapeXml", () => {
    test("escapes all five XML predefined entities", () => {
        expect(escapeXml("&<>\"'")).toBe("&amp;&lt;&gt;&quot;&apos;");
    });

    test("escapes the ampersand first so existing entities are not double-decoded", () => {
        expect(escapeXml("&amp;")).toBe("&amp;amp;");
    });

    test("neutralizes a tag injected into feed text", () => {
        expect(escapeXml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    });

    test("leaves ordinary text untouched", () => {
        expect(escapeXml("こんにちは world")).toBe("こんにちは world");
        expect(escapeXml("")).toBe("");
    });
});

describe("contentType", () => {
    test.each([
        [".html", "text/html"],
        [".css", "text/css"],
        [".js", "text/javascript"],
        [".json", "application/json"],
        [".xml", "application/xml"],
        [".svg", "image/svg+xml"],
        [".webp", "image/webp"],
        [".woff2", "font/woff2"],
    ])("maps %s", (ext, expected) => {
        expect(contentType(ext)).toBe(expected);
    });

    test.each([
        ["an unknown extension", ".nosuch"],
        ["an empty extension", ""],
        ["an extension without the dot", "html"],
        ["an uppercase extension", ".HTML"],
    ])("falls back to text/plain for %s", (_name, ext) => {
        expect(contentType(ext)).toBe("text/plain");
    });
});

describe("appendClientScriptAndCss", () => {
    const html = () => renderToStaticMarkup(appendClientScriptAndCss(createElement("div", null, "body"), "/assets/client.js", "/assets/styles.css"));

    test("keeps the page tree and appends the client assets", () => {
        expect(html()).toContain("<div>body</div>");
    });

    test("references the client bundle as an external module script", () => {
        // async は React 19 のメタデータ巻き上げ（<head> への移動）の発火条件。
        expect(html()).toContain('<script async="" type="module" src="/assets/client.js"></script>');
    });

    test("references the stylesheet as an external link with a precedence", () => {
        // precedence が無いと link は <body> に残り FOUC になる。
        expect(html()).toContain('<link rel="stylesheet" href="/assets/styles.css" data-precedence="default"/>');
    });

    test("introduces no inline script or style", () => {
        expect(scanMarkup(html(), "page")).toEqual([]);
    });
});

describe("defineContent", () => {
    test("returns a handler carrying the given loader", () => {
        const loader = async () => ({ posts: [] });
        expect(defineContent({ loader }).loader).toBe(loader);
    });

    test("does not call the loader at definition time", async () => {
        let called = false;
        const handler = defineContent({
            loader: async () => {
                called = true;
                return 1;
            },
        });
        expect(called).toBe(false);
        await expect(handler.loader()).resolves.toBe(1);
        expect(called).toBe(true);
    });
});
