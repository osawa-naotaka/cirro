import { describe, expect, test } from "vitest";
import { registerIslandUsage, runWithRegistry } from "../src/registry/registry.ts";
import type { ResolvedPath } from "../src/runtime/router.ts";
import { validateCssUrl } from "../src/runtime/setup.ts";
import { validateRoutes } from "../src/runtime/validate.ts";

// ResolvedPath の html / file ページを手軽に作るヘルパー。
function html(path: string): ResolvedPath {
    return { type: "html", path, render: () => ({}) as never };
}
function file(path: string): ResolvedPath {
    return { type: "file", path, ext: ".json", render: () => "" };
}
function css(path: string): ResolvedPath {
    return { type: "css", path, render: () => ({}) as never };
}

describe("validateRoutes: path format (S4)", () => {
    test.each([
        ["missing leading slash", html("about.html")],
        ["protocol-relative", html("//evil/about.html")],
        ["backslash", html("/a\\b.html")],
        ["query", html("/about.html?x=1")],
        ["fragment", html("/about.html#top")],
        ["dot segment", html("/a/./b.html")],
        ["dotdot segment", html("/a/../b.html")],
        ["empty segment", html("/a//b.html")],
        ["html route without .html", html("/about")],
        ["file route without extension", file("/search-index")],
    ])("rejects %s", (_name, page) => {
        const errors = validateRoutes([page], []);
        expect(errors).toHaveLength(1);
        expect(errors[0]?.type).toBe("malformed-path");
    });

    test.each([
        ["clean html route", html("/about.html")],
        ["directory index", html("/path/to/index.html")],
        [".htm route", html("/about.htm")],
        ["file route with extension", file("/search-index.json")],
    ])("accepts %s", (_name, page) => {
        expect(validateRoutes([page], [])).toEqual([]);
    });

    test("ignores synthetic css routes", () => {
        expect(validateRoutes([css("/about.html.css")], [])).toEqual([]);
    });
});

describe("validateRoutes: duplicates (S2)", () => {
    test("collects duplicate output paths once with the count", () => {
        const errors = validateRoutes([html("/blog/a.html"), html("/blog/a.html"), html("/blog/b.html")], []);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatchObject({ type: "duplicate-path", path: "/blog/a.html" });
        expect(errors[0]?.detail).toContain("2 routes");
    });

    test("detects html vs file route collisions too", () => {
        const errors = validateRoutes([file("/feed.json"), file("/feed.json")], []);
        expect(errors).toHaveLength(1);
        expect(errors[0]?.type).toBe("duplicate-path");
    });
});

describe("validateRoutes: public collisions (S3)", () => {
    test("detects an exact route vs public collision", () => {
        const errors = validateRoutes([html("/about.html")], ["/about.html"]);
        expect(errors.some((e) => e.type === "public-collision")).toBe(true);
    });

    test("detects clean-URL spelling collisions", () => {
        // ルート /about.html は /about でも配信される。public/about はその綴りを占有する。
        const errors = validateRoutes([html("/about.html")], ["/about"]);
        expect(errors.some((e) => e.type === "public-collision" && e.path === "/about")).toBe(true);
    });

    test("no collision for unrelated public files", () => {
        expect(validateRoutes([html("/about.html")], ["/images/logo.png"])).toEqual([]);
    });
});

describe("validateCssUrl (S6)", () => {
    test.each(["assets/styles.css", "//cdn/styles.css", "/a/../styles.css", "/a\\b.css"])("rejects %s", (url) => {
        expect(() => validateCssUrl(url)).toThrow();
    });

    test("accepts a root-relative path", () => {
        expect(() => validateCssUrl("/assets/styles.css")).not.toThrow();
    });
});

describe("registerIslandUsage (S1 / S1' / S5)", () => {
    function run(fn: () => void, islandNames?: Set<string>) {
        return runWithRegistry(fn, undefined, undefined, { islandNames });
    }

    test("collects not-configured when the islands option is absent", () => {
        const { errors } = run(() => registerIslandUsage("counter", {}));
        expect(errors).toEqual([{ cause: "island", type: "not-configured", island: "counter" }]);
    });

    test("collects unknown-name when the name is not a registry key", () => {
        const { errors } = run(() => registerIslandUsage("nope", {}), new Set(["counter"]));
        expect(errors).toEqual([{ cause: "island", type: "unknown-name", island: "nope" }]);
    });

    test("accepts a registered island with serializable props", () => {
        const { errors } = run(() => registerIslandUsage("counter", { initial: 1, label: "x", nested: { list: [1, "a", true, null] } }), new Set(["counter"]));
        expect(errors).toEqual([]);
    });

    test.each([
        ["function", { onClick: () => {} }, "props.onClick", "function"],
        ["undefined", { value: undefined }, "props.value", "undefined"],
        ["bigint", { big: 1n }, "props.big", "bigint"],
        ["non-finite number", { nan: Number.NaN }, "props.nan", "non-finite number"],
        ["Date", { date: new Date(0) }, "props.date", "non-plain object (Date)"],
        ["Map", { map: new Map() }, "props.map", "non-plain object (Map)"],
        ["nested in array", { items: [{ fn: () => {} }] }, "props.items[0].fn", "function"],
    ])("collects island-props for %s", (_name, props, path, kind) => {
        const { errors } = run(() => registerIslandUsage("counter", props), new Set(["counter"]));
        expect(errors).toEqual([{ cause: "island-props", island: "counter", path, kind }]);
    });

    test("collects circular references instead of recursing forever", () => {
        const props: Record<string, unknown> = {};
        props.self = props;
        const { errors } = run(() => registerIslandUsage("counter", props), new Set(["counter"]));
        expect(errors).toEqual([{ cause: "island-props", island: "counter", path: "props.self", kind: "circular reference" }]);
    });
});
