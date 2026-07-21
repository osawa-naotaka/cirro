import { createElement, type ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { faDir } from "../src/lib/fontawesome.ts";
import type { AnyRoute } from "../src/lib/route.ts";
import { createRouteFn } from "../src/lib/route.ts";
import { expandRoutes, expandTemporaryRoutes } from "../src/runtime/router.ts";

type Content = { posts: { slug: string; title: string }[] };

const content: Content = {
    posts: [
        { slug: "hello", title: "Hello" },
        { slug: "world", title: "World" },
    ],
};

const { route } = createRouteFn<Content>();

// component が params / content から組み立てた値を取り出す（描画結果の中身を見る）。
function childrenOf(element: ReactElement): unknown {
    return (element.props as { children?: unknown }).children;
}

// params / content が component へ正しく渡ることを確かめるため、受け取った値を
// そのまま持ち出せる形で描画する。
const staticRoute = route({
    type: "static",
    path: "/about.html",
    component: ({ content: c }) => createElement("p", null, c.posts.length),
});

const dynamicRoute = route({
    type: "dynamic",
    path: (params: { slug: string }) => `/posts/${params.slug}.html`,
    getStaticPaths: (c) => c.posts.map((p) => ({ slug: p.slug })),
    component: ({ params }) => createElement("p", null, params.slug),
});

const fileRoute = route({
    type: "file",
    path: "/search-index.json",
    component: ({ content: c }) => JSON.stringify(c.posts.map((p) => p.slug)),
});

describe("expandRoutes", () => {
    test("expands a static route into a single html page", () => {
        const [page] = expandRoutes([staticRoute], content);
        expect(page).toMatchObject({ type: "html", path: "/about.html" });
    });

    test("expands a dynamic route once per entry returned by getStaticPaths", () => {
        const pages = expandRoutes([dynamicRoute], content);
        expect(pages.map((p) => p.path)).toEqual(["/posts/hello.html", "/posts/world.html"]);
        expect(pages.every((p) => p.type === "html")).toBe(true);
    });

    test("expands a dynamic route with no static paths into nothing", () => {
        const empty = route({ ...dynamicRoute, getStaticPaths: () => [] });
        expect(expandRoutes([empty], content)).toEqual([]);
    });

    test("expands a file route and derives its extension", () => {
        const [page] = expandRoutes([fileRoute], content);
        expect(page).toMatchObject({ type: "file", path: "/search-index.json", ext: ".json" });
    });

    test("keeps the declaration order across route kinds", () => {
        const pages = expandRoutes([staticRoute, dynamicRoute, fileRoute], content);
        expect(pages.map((p) => p.path)).toEqual(["/about.html", "/posts/hello.html", "/posts/world.html", "/search-index.json"]);
    });

    test("returns nothing for an empty route list", () => {
        expect(expandRoutes([], content)).toEqual([]);
    });

    test("defers rendering until render() is called", () => {
        let calls = 0;
        const counted = route({
            type: "static",
            path: "/x.html",
            component: () => {
                calls++;
                return createElement("p");
            },
        });
        const [page] = expandRoutes([counted], content);
        expect(calls).toBe(0);
        if (page?.type === "html") page.render();
        expect(calls).toBe(1);
    });

    test("passes params and content through to the component", () => {
        const pages = expandRoutes([dynamicRoute, staticRoute], content);
        const dynamicPage = pages[0];
        const staticPage = pages[2];
        if (dynamicPage?.type !== "html" || staticPage?.type !== "html") throw new Error("unexpected page type");
        expect(childrenOf(dynamicPage.render())).toBe("hello");
        expect(childrenOf(staticPage.render())).toBe(2);
    });

    test("passes an empty params object to static and file routes", () => {
        const capture = route({
            type: "static",
            path: "/x.html",
            component: ({ params }) => createElement("p", null, Object.keys(params).length),
        });
        const [page] = expandRoutes([capture], content);
        if (page?.type !== "html") throw new Error("unexpected page type");
        expect(childrenOf(page.render())).toBe(0);
    });

    test("renders a file route to its string body", () => {
        const [page] = expandRoutes([fileRoute], content);
        if (page?.type !== "file") throw new Error("unexpected page type");
        expect(page.render()).toBe('["hello","world"]');
    });

    test.each([
        ["a plain extension", "/search-index.json", ".json"],
        ["the last of multiple dots", "/archive.tar.gz", ".gz"],
        ["a dot in a parent directory only", "/v1.0/manifest", ""],
        ["no extension at all", "/feed", ""],
        ["a leading dot (dotfile is not an extension)", "/.well-known", ""],
    ])("derives the file route extension from %s", (_name, path, ext) => {
        const [page] = expandRoutes([route({ type: "file", path, component: () => "" })], content);
        expect(page).toMatchObject({ ext });
    });
});

describe("expandTemporaryRoutes", () => {
    // dev サーバーはページごとの CSS を併走ルート（.css）として提供する。
    test("emits a css route alongside each html page", () => {
        const pages = expandTemporaryRoutes([staticRoute, dynamicRoute], content);
        const cssPages = pages.filter((p) => p.type === "css");
        expect(cssPages.map((p) => p.path)).toEqual(["/about.html.css", "/posts/hello.html.css", "/posts/world.html.css"]);
    });

    test("emits no css route for a file route", () => {
        const pages = expandTemporaryRoutes([fileRoute], content);
        expect(pages.some((p) => p.type === "css")).toBe(false);
    });

    test("always appends the three fontawesome sprite routes", () => {
        const pages = expandTemporaryRoutes([], content);
        expect(pages.map((p) => p.path)).toEqual([`${faDir}/brands.svg`, `${faDir}/regular.svg`, `${faDir}/solid.svg`]);
        expect(pages.every((p) => p.type === "fontawesome" && p.ext === ".svg")).toBe(true);
    });

    test("renders a sprite route to svg markup without a style attribute", () => {
        const sprite = expandTemporaryRoutes([], content).find((p) => p.path === `${faDir}/solid.svg`);
        if (sprite?.type !== "fontawesome") throw new Error("unexpected page type");
        const svg = sprite.render();
        expect(svg).toContain("<symbol");
        expect(svg).not.toContain("style=");
    });

    test("shares the same expansion of dynamic routes as expandRoutes", () => {
        const html = expandRoutes([dynamicRoute], content).map((p) => `${p.path}.css`);
        const css = expandTemporaryRoutes([dynamicRoute], content)
            .filter((p) => p.type === "css")
            .map((p) => p.path);
        expect(css).toEqual(html);
    });
});

describe("createRouteFn", () => {
    test("carries content and site through defineRoutes", () => {
        const contentHandler = { loader: async () => content };
        const site = { origin: "https://example.com", title: "t" } as never;
        const { defineRoutes } = createRouteFn<Content>({ content: contentHandler, site });
        const defined = defineRoutes(staticRoute);
        expect(defined.content).toBe(contentHandler);
        expect(defined.site).toBe(site);
        expect(defined.routes).toEqual([staticRoute]);
    });

    test("returns undefined content and site when no options are given", () => {
        const defined = createRouteFn().defineRoutes();
        expect(defined.content).toBeUndefined();
        expect(defined.site).toBeUndefined();
        expect(defined.routes).toEqual([]);
    });

    test("rejects the old createRouteFn(content) signature with a migration message", () => {
        expect(() => createRouteFn({ loader: async () => undefined } as never)).toThrow(/createRouteFn\(\{ content \}\)/);
    });

    test("route() returns the definition unchanged (it is a type inference helper)", () => {
        const def: AnyRoute<Content> = staticRoute;
        expect(createRouteFn<Content>().route(def as never)).toBe(def);
    });
});
