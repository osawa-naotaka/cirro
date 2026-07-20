import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Ogp } from "../src/lib/Ogp.tsx";
import { rssXml } from "../src/lib/rss.ts";
import { defineSite } from "../src/lib/site.ts";
import { sitemapXml } from "../src/lib/sitemap.ts";
import { absoluteUrl, pageUrl, runWithRegistry } from "../src/registry/registry.ts";

const site = defineSite({
    origin: "https://example.com",
    title: "Example Site",
    description: "site description",
    lang: "ja",
});

// runWithRegistry のコンテキストで fn を実行するテストハーネス。
function inContext<T>(fn: () => T, opt?: { noSite?: boolean; links?: Set<string>; pagePath?: string; htmlPaths?: string[] }) {
    return runWithRegistry(fn, undefined, opt?.links, {
        site: opt?.noSite ? undefined : site,
        pagePath: opt?.pagePath,
        htmlPaths: opt?.htmlPaths,
    });
}

describe("defineSite", () => {
    test("accepts a bare origin and freezes the result", () => {
        const s = defineSite({ origin: "http://localhost:5173", title: "t" });
        expect(s.origin).toBe("http://localhost:5173");
        expect(Object.isFrozen(s)).toBe(true);
    });

    test.each([
        ["trailing slash", "https://example.com/"],
        ["path (subpath deployment)", "https://example.com/repo"],
        ["query", "https://example.com?x=1"],
        ["fragment", "https://example.com#top"],
        ["uppercase host", "https://EXAMPLE.com"],
        ["non-http scheme", "ftp://example.com"],
        ["not a URL", "example.com"],
    ])("rejects origin with %s", (_name, origin) => {
        expect(() => defineSite({ origin, title: "t" })).toThrow();
    });

    test("rejects an empty title", () => {
        expect(() => defineSite({ origin: "https://example.com", title: "" })).toThrow();
    });
});

describe("absoluteUrl / pageUrl", () => {
    test("absoluteUrl joins origin and validates against the link store", () => {
        const { result, errors } = inContext(() => absoluteUrl("/about"), { links: new Set(["/about"]) });
        expect(result).toBe("https://example.com/about");
        expect(errors).toEqual([]);
    });

    test("absoluteUrl collects a not-found violation for unknown paths", () => {
        const { errors } = inContext(() => absoluteUrl("/missing"), { links: new Set(["/about"]) });
        expect(errors).toEqual([{ cause: "broken-link", type: "not-found", link: "/missing" }]);
    });

    test("absoluteUrl without site collects missingSite and returns the path as-is", () => {
        const { result, errors } = inContext(() => absoluteUrl("/about"), { noSite: true });
        expect(result).toBe("/about");
        expect(errors).toEqual([{ cause: "missing-site", feature: "absoluteUrl()" }]);
    });

    test("pageUrl returns the absolute clean URL of the current page", () => {
        const { result, errors } = inContext(() => pageUrl(), { pagePath: "/blog/hello" });
        expect(result).toBe("https://example.com/blog/hello");
        expect(errors).toEqual([]);
    });

    test("helpers throw outside of a render context", () => {
        expect(() => absoluteUrl("/about")).toThrow(/outside of a render context/);
        expect(() => pageUrl()).toThrow(/outside of a render context/);
    });
});

describe("sitemapXml", () => {
    const htmlPaths = ["/", "/about", "/blog/", "/blog/a&b"];

    test("lists html pages as absolute clean URLs with XML escaping", () => {
        const { result } = inContext(() => sitemapXml()(), { htmlPaths });
        expect(result).toContain("<loc>https://example.com/</loc>");
        expect(result).toContain("<loc>https://example.com/about</loc>");
        expect(result).toContain("<loc>https://example.com/blog/a&amp;b</loc>");
        expect(result).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    });

    test("filter excludes pages", () => {
        const { result } = inContext(() => sitemapXml({ filter: (p) => p !== "/about" })(), { htmlPaths });
        expect(result).not.toContain("/about");
        expect(result).toContain("<loc>https://example.com/</loc>");
    });

    test("without site collects missingSite and emits nothing", () => {
        const { result, errors } = inContext(() => sitemapXml()(), { htmlPaths, noSite: true });
        expect(result).toBe("");
        expect(errors).toEqual([{ cause: "missing-site", feature: "sitemapXml()" }]);
    });
});

describe("rssXml", () => {
    const items = [
        { title: "new & shiny", path: "/blog/new", date: new Date("2026-06-10T00:00:00Z"), description: "d1" },
        { title: "old", path: "/blog/old", date: new Date("2026-06-01T00:00:00Z") },
    ];
    const links = new Set(["/blog/new", "/blog/old"]);

    test("channel falls back to site metadata and lastBuildDate is the newest item date", () => {
        const { result, errors } = inContext(() => rssXml({ items }), { links });
        expect(result).toContain("<title>Example Site</title>");
        expect(result).toContain("<description>site description</description>");
        expect(result).toContain("<language>ja</language>");
        expect(result).toContain("<lastBuildDate>Wed, 10 Jun 2026 00:00:00 GMT</lastBuildDate>");
        expect(result).toContain("<title>new &amp; shiny</title>");
        expect(result).toContain('<guid isPermaLink="true">https://example.com/blog/new</guid>');
        expect(errors).toEqual([]);
    });

    test("channel title / description can be overridden per feed", () => {
        const { result } = inContext(() => rssXml({ items, title: "Tag Feed", description: "only tag" }), { links });
        expect(result).toContain("<title>Tag Feed</title>");
        expect(result).toContain("<description>only tag</description>");
    });

    test("item paths are validated against the link store", () => {
        const { errors } = inContext(() => rssXml({ items: [{ title: "x", path: "/nope", date: new Date(0) }] }), { links });
        expect(errors).toEqual([{ cause: "broken-link", type: "not-found", link: "/nope" }]);
    });

    test("missing channel description is reported on the missingSite rail", () => {
        const bare = defineSite({
            origin: "https://example.com",
            title: "t",
        });
        const { errors } = runWithRegistry(() => rssXml({ items }), undefined, links, { site: bare });
        expect(errors).toHaveLength(1);

        if (errors[0].cause === "missing-site") expect(errors[0].feature).toContain("channel description");
    });
});

describe("Ogp", () => {
    test("emits og meta tags with an automatic og:url", () => {
        const { result } = inContext(() => renderToStaticMarkup(createElement(Ogp, { title: "Post Title", type: "article" })), {
            pagePath: "/blog/hello",
        });
        expect(result).toContain('<meta property="og:title" content="Post Title"/>');
        expect(result).toContain('<meta property="og:type" content="article"/>');
        expect(result).toContain('<meta property="og:url" content="https://example.com/blog/hello"/>');
        expect(result).toContain('<meta property="og:site_name" content="Example Site"/>');
        expect(result).toContain('<meta property="og:description" content="site description"/>');
        expect(result).not.toContain("og:image");
        expect(result).not.toContain("twitter:card");
    });

    test("emits og:image as an absolute URL when the image exists", () => {
        const { result, errors } = inContext(
            () => renderToStaticMarkup(createElement(Ogp, { title: "t", image: "/images/ogp.png", twitterCard: "summary_large_image" })),
            { pagePath: "/", links: new Set(["/images/ogp.png"]) },
        );
        expect(result).toContain('<meta property="og:image" content="https://example.com/images/ogp.png"/>');
        expect(result).toContain('<meta name="twitter:card" content="summary_large_image"/>');
        expect(errors).toEqual([]);
    });

    test("collects a violation and omits og:image when the image is missing", () => {
        const { result, errors } = inContext(() => renderToStaticMarkup(createElement(Ogp, { title: "t", image: "/images/nope.png" })), {
            pagePath: "/",
            links: new Set([]),
        });
        expect(result).not.toContain("og:image");
        expect(errors).toEqual([{ cause: "broken-image-src", type: "not-found", from: "/images/nope.png" }]);
    });

    test("without site renders nothing and collects missingSite", () => {
        const { result, errors } = inContext(() => renderToStaticMarkup(createElement(Ogp, { title: "t" })), { noSite: true });
        expect(result).toBe("");
        expect(errors).toEqual([{ cause: "missing-site", feature: "<Ogp>" }]);
    });
});
