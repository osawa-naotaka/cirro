import { createElement } from "react";
import { describe, expect, test } from "vitest";
import { ss, toStyle } from "../src/lib/css.ts";
import { styleSample } from "../src/lib/styleSample.ts";
import {
    absoluteUrl,
    checkImage,
    checkLink,
    currentPagePath,
    htmlPagePaths,
    registerGlobalRuleDesignator,
    registerIcon,
    registerRules,
    registerStyleSample,
    reportMissingSiteConfig,
    requireSite,
    runWithRegistry,
} from "../src/registry/registry.ts";

const links = new Set(["/about", "/about.html", "/images/logo.png"]);

function run<T>(fn: () => T, opt?: { links?: Set<string> }) {
    return runWithRegistry(fn, undefined, opt && "links" in opt ? opt.links : links);
}

describe("checkLink", () => {
    test.each([
        ["root-relative existing link", "/about"],
        ["link with a fragment", "/about#top"],
        ["link with a query", "/about?x=1"],
        ["bare anchor", "#top"],
    ])("accepts a %s", (_name, link) => {
        expect(run(() => checkLink(link)).errors).toEqual([]);
    });

    test.each([
        ["protocol-relative", "//evil.example.com"],
        ["backslash escape", "/\\evil.example.com"],
        ["relative path", "./about"],
        ["bare word", "about"],
        ["absolute URL", "https://example.com/"],
    ])("collects malformed for a %s link", (_name, link) => {
        expect(run(() => checkLink(link)).errors).toEqual([{ cause: "broken-link", type: "malformed", link }]);
    });

    test("collects not-found for an unknown root-relative link", () => {
        expect(run(() => checkLink("/nope")).errors).toEqual([{ cause: "broken-link", type: "not-found", link: "/nope" }]);
    });

    test("collects malformed for an invalid percent-encoding", () => {
        expect(run(() => checkLink("/%E0%A4%A")).errors).toEqual([{ cause: "broken-link", type: "malformed", link: "/%E0%A4%A" }]);
    });

    test("matches a percent-encoded link against its decoded form", () => {
        // collectLinks が登録するのはデコード済みの綴りなので、照合側もデコードして合わせる。
        expect(run(() => checkLink("/%E3%81%82.html"), { links: new Set(["/あ.html"]) }).errors).toEqual([]);
    });

    test("accepts any root-relative link when no link set is available", () => {
        expect(run(() => checkLink("/anything"), { links: undefined }).errors).toEqual([]);
    });

    test("throws outside of a render context", () => {
        expect(() => checkLink("/about")).toThrow(/outside of a render context/);
    });
});

describe("checkImage", () => {
    test("returns the source unchanged for an existing public image", () => {
        const { result, errors } = run(() => checkImage("/images/logo.png"));
        expect(result).toBe("/images/logo.png");
        expect(errors).toEqual([]);
    });

    test("matches against the link set ignoring query and fragment", () => {
        const { result, errors } = run(() => checkImage("/images/logo.png?v=2"));
        expect(result).toBe("/images/logo.png?v=2");
        expect(errors).toEqual([]);
    });

    test("collects not-found and drops the source for a missing public image", () => {
        const { result, errors } = run(() => checkImage("/images/nope.png"));
        expect(result).toBeNull();
        expect(errors).toEqual([{ cause: "broken-image-src", type: "not-found", from: "/images/nope.png" }]);
    });

    test.each([
        ["a bare colon prefix (asset from the cirro package)", ":/icons/x.svg"],
        ["a package specifier", "some-pkg:/x.png"],
        ["a scoped package specifier", "@scope/some-pkg:/x.png"],
    ])("collects unsupported for %s", (_name, from) => {
        const { result, errors } = run(() => checkImage(from));
        expect(result).toBeNull();
        expect(errors).toEqual([{ cause: "broken-image-src", type: "unsupported", from }]);
    });

    test.each([
        ["a relative path", "./x.png"],
        ["a bare filename", "x.png"],
        ["a protocol-relative URL", "//example.com/x.png"],
        ["an absolute URL", "https://example.com/x.png"],
        ["an invalid percent-encoding", "/%E0%A4%A.png"],
    ])("collects malformed for %s", (_name, from) => {
        const { result, errors } = run(() => checkImage(from));
        expect(result).toBeNull();
        expect(errors[0]).toMatchObject({ cause: "broken-image-src", from });
    });

    test("throws outside of a render context", () => {
        expect(() => checkImage("/images/logo.png")).toThrow(/outside of a render context/);
    });
});

describe("registerIcon", () => {
    test("records a known icon in the registry", () => {
        const { registry, errors } = run(() => registerIcon({ type: "solid", name: "house" }));
        expect([...registry.icon]).toEqual(["solid/house"]);
        expect(errors).toEqual([]);
    });

    test("deduplicates repeated registrations", () => {
        const { registry } = run(() => {
            registerIcon({ type: "solid", name: "house" });
            registerIcon({ type: "solid", name: "house" });
        });
        expect(registry.icon.size).toBe(1);
    });

    test("collects not-exist for an unknown icon name", () => {
        const { registry, errors } = run(() => registerIcon({ type: "solid", name: "nosuch" } as never));
        expect(registry.icon.size).toBe(0);
        expect(errors).toEqual([{ cause: "broken-image-src", type: "not-exist", from: "solid/nosuch" }]);
    });

    test("collects not-exist for an unknown icon type", () => {
        const { errors } = run(() => registerIcon({ type: "nosuch", name: "house" } as never));
        expect(errors).toEqual([{ cause: "broken-image-src", type: "not-exist", from: "nosuch/house" }]);
    });

    test("throws outside of a render context", () => {
        expect(() => registerIcon({ type: "solid", name: "house" })).toThrow(/outside of a render context/);
    });
});

describe("render context accessors", () => {
    function withContext<T>(fn: () => T, context: Parameters<typeof runWithRegistry>[3]) {
        return runWithRegistry(fn, undefined, links, context);
    }

    const site = { origin: "https://example.com", title: "t" } as never;

    test("requireSite returns the declared site", () => {
        const { result, errors } = withContext(() => requireSite("<Ogp>"), { site });
        expect(result).toBe(site);
        expect(errors).toEqual([]);
    });

    test("requireSite collects missing-site and returns null when undeclared", () => {
        const { result, errors } = withContext(() => requireSite("<Ogp>"), {});
        expect(result).toBeNull();
        expect(errors).toEqual([{ cause: "missing-site", feature: "<Ogp>" }]);
    });

    test("reportMissingSiteConfig puts a violation on the same rail", () => {
        const { errors } = withContext(() => reportMissingSiteConfig("rssXml(): description"), { site });
        expect(errors).toEqual([{ cause: "missing-site", feature: "rssXml(): description" }]);
    });

    test("currentPagePath and htmlPagePaths surface what the runtime passed in", () => {
        const { result } = withContext(() => [currentPagePath(), htmlPagePaths()], { pagePath: "/about", htmlPaths: ["/", "/about"] });
        expect(result).toEqual(["/about", ["/", "/about"]]);
    });

    test("htmlPagePaths defaults to an empty list and currentPagePath to undefined", () => {
        const { result } = withContext(() => [currentPagePath(), htmlPagePaths()], {});
        expect(result).toEqual([undefined, []]);
    });

    test.each([
        ["requireSite", () => requireSite("x")],
        ["reportMissingSiteConfig", () => reportMissingSiteConfig("x")],
        ["currentPagePath", () => currentPagePath()],
        ["htmlPagePaths", () => htmlPagePaths()],
        ["absoluteUrl", () => absoluteUrl("/about")],
    ])("%s throws outside of a render context", (_name, fn) => {
        expect(fn).toThrow(/outside of a render context/);
    });
});

describe("runWithRegistry: context isolation", () => {
    // モジュールグローバルな可変 Map を共有しない設計（AsyncLocalStorage）の担保。
    test("gives each run its own registry", () => {
        const a = run(() => toStyle(ss({ color: "red" })));
        const b = run(() => toStyle(ss({ color: "blue" })));
        expect([...a.registry.style.keys()]).toEqual([a.result]);
        expect([...b.registry.style.keys()]).toEqual([b.result]);
        expect(a.registry).not.toBe(b.registry);
    });

    test("does not leak registrations from a nested run to the outer one", () => {
        const outer = run(() => {
            toStyle(ss({ color: "red" }));
            const inner = run(() => toStyle(ss({ color: "blue" })));
            return inner;
        });
        expect(outer.registry.style.size).toBe(1);
        expect(outer.result.registry.style.size).toBe(1);
        expect(outer.registry.style.has(outer.result.result)).toBe(false);
    });

    test("does not leak errors from a nested run to the outer one", () => {
        const outer = run(() => run(() => checkLink("/nope")));
        expect(outer.errors).toEqual([]);
        expect(outer.result.errors).toHaveLength(1);
    });

    test("seeds the registry from the init argument", () => {
        const { registry: seed } = run(() => toStyle(ss({ color: "red" })));
        const { registry } = runWithRegistry(() => toStyle(ss({ color: "blue" })), seed);
        expect(registry).toBe(seed);
        expect(registry.style.size).toBe(2);
    });

    test("registerRules throws outside of a render context", () => {
        expect(() => registerRules("x", [])).toThrow(/outside of a render context/);
    });

    test("registerGlobalRuleDesignator throws outside of a render context", () => {
        expect(() => registerGlobalRuleDesignator("x")).toThrow(/outside of a render context/);
    });
});

describe("runWithRegistry: styleSample", () => {
    // 初期描画に現れない部分の css() を収集する仕組み（05_STYLING.md 7.3）。
    function Sampled() {
        toStyle(ss({ color: "blue" }, { name: "sampled" } as never));
        return createElement("p");
    }

    test("collects css registered by a sampled element after the main render", () => {
        const { registry } = run(() => {
            styleSample(createElement(Sampled));
            return toStyle(ss({ color: "red" }));
        });
        expect(registry.style.size).toBe(2);
    });

    test("processes samples queued by a sample (the queue is drained transitively)", () => {
        function Outer() {
            styleSample(createElement(Sampled));
            return createElement("p");
        }
        const { registry } = run(() => {
            styleSample(createElement(Outer));
        });
        expect(registry.style.size).toBe(1);
    });

    test("does not render samples during the main render", () => {
        let rendered = false;
        function Marker() {
            rendered = true;
            return createElement("p");
        }
        run(() => {
            styleSample(createElement(Marker));
            expect(rendered).toBe(false);
        });
        expect(rendered).toBe(true);
    });

    test("fails loudly instead of looping forever when a sample samples itself", () => {
        function SelfSampling(): ReturnType<typeof createElement> {
            styleSample(createElement(SelfSampling));
            return createElement("p");
        }
        expect(() =>
            run(() => {
                styleSample(createElement(SelfSampling));
            }),
        ).toThrow(/processed more than 1000 elements/);
    });

    test("registerStyleSample throws outside of a render context", () => {
        expect(() => registerStyleSample(createElement("p"))).toThrow(/outside of a render context/);
    });
});
