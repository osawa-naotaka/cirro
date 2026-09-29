import { type DefaultTreeAdapterMap, parseFragment } from "parse5";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { FaImage } from "../src/lib/FaImage.tsx";
import { solid } from "../src/lib/fontawesome-solid.ts";
import { Image } from "../src/lib/Image.tsx";
import { Link } from "../src/lib/Link.tsx";
import { runWithRegistry } from "../src/registry/registry.ts";
import { scanMarkup } from "./scan.ts";

const links = new Set(["/about", "/about.html", "/images/logo.png"]);

// biome-ignore lint/suspicious/noExplicitAny: 任意のコンポーネントを props つきで描画する
function render(component: any, props: any) {
    const { result, registry, errors } = runWithRegistry(() => renderToStaticMarkup(createElement(component, props)), undefined, links);
    return { html: result, registry, errors };
}

// 指定タグの最初の要素の属性を名前→値のオブジェクトで返す。
// React 19 は <img> の前に <link rel="preload" as="image"> を巻き上げることがあるため、
// 先頭ノードではなく目的のタグを名指しで拾う。
function attrsOf(html: string, tagName: string): Record<string, string> {
    const found = find(parseFragment(html), tagName);
    if (!found) throw new Error(`<${tagName}> not found in: ${html}`);
    return Object.fromEntries(found.attrs.map((a) => [a.name, a.value]));
}

function find(node: DefaultTreeAdapterMap["node"], tagName: string): DefaultTreeAdapterMap["element"] | undefined {
    if ("tagName" in node && node.tagName === tagName) return node;
    if ("childNodes" in node) {
        for (const child of node.childNodes) {
            const found = find(child, tagName);
            if (found) return found;
        }
    }
    return undefined;
}

describe("Link", () => {
    test("renders an anchor whose href is the to prop", () => {
        const { html, errors } = render(Link, { to: "/about", children: "About" });
        expect(html).toBe('<a href="/about">About</a>');
        expect(errors).toEqual([]);
    });

    test("passes the remaining anchor attributes through", () => {
        const { html } = render(Link, { to: "/about", className: "nav", id: "a1", "aria-label": "about", children: "About" });
        expect(attrsOf(html, "a")).toEqual({ class: "nav", id: "a1", "aria-label": "about", href: "/about" });
    });

    test("renders without children", () => {
        expect(render(Link, { to: "/about" }).html).toBe('<a href="/about"></a>');
    });

    test("collects a violation for a broken link but still renders the anchor", () => {
        const { html, errors } = render(Link, { to: "/nope", children: "x" });
        expect(html).toBe('<a href="/nope">x</a>');
        expect(errors).toEqual([{ cause: "broken-link", type: "not-found", link: "/nope" }]);
    });

    test("collects a violation for a malformed link", () => {
        const { errors } = render(Link, { to: "//evil.example.com", children: "x" });
        expect(errors).toEqual([{ cause: "broken-link", type: "malformed", link: "//evil.example.com" }]);
    });

    test("cannot be used to smuggle a javascript: URL past the link check", () => {
        // javascript: は malformed として報告され、生成物は csp.test.ts の走査でも違反になる。
        const { html, errors } = render(Link, { to: "javascript:alert(1)", children: "x" });
        expect(errors).toEqual([{ cause: "broken-link", type: "malformed", link: "javascript:alert(1)" }]);
        expect(scanMarkup(html, "link")).toHaveLength(1);
    });
});

describe("Image", () => {
    test("renders an img with the resolved src", () => {
        const { html, errors } = render(Image, { from: "/images/logo.png", alt: "logo" });
        expect(attrsOf(html, "img")).toEqual({ alt: "logo", src: "/images/logo.png" });
        expect(errors).toEqual([]);
    });

    test("passes the remaining img attributes through", () => {
        const { html } = render(Image, { from: "/images/logo.png", alt: "logo", width: 32, height: 32, loading: "lazy" });
        expect(attrsOf(html, "img")).toEqual({ alt: "logo", src: "/images/logo.png", width: "32", height: "32", loading: "lazy" });
    });

    test("drops the src when the image does not exist, keeping the other attributes", () => {
        const { html, errors } = render(Image, { from: "/images/nope.png", alt: "x", className: "thumb" });
        expect(attrsOf(html, "img")).toEqual({ alt: "x", class: "thumb" });
        expect(errors).toEqual([{ cause: "broken-image-src", type: "not-found", from: "/images/nope.png" }]);
    });

    test("drops the src for a malformed source", () => {
        const { html, errors } = render(Image, { from: "./logo.png", alt: "x" });
        expect(attrsOf(html, "img")).toEqual({ alt: "x" });
        expect(errors).toEqual([{ cause: "broken-image-src", type: "malformed", from: "./logo.png" }]);
    });

    test("renders an empty alt as an empty attribute (decorative image)", () => {
        expect(attrsOf(render(Image, { from: "/images/logo.png", alt: "" }).html, "img")).toEqual({ alt: "", src: "/images/logo.png" });
    });
});

describe("FaImage", () => {
    test("renders an svg referencing the sprite symbol by icon name", () => {
        const { html } = render(FaImage, { icon: { type: "solid", name: "house" } });
        expect(html).toContain('<use href="/fa/solid.svg#house"></use>');
    });

    test("takes the viewBox width from the icon table", () => {
        const { html } = render(FaImage, { icon: { type: "solid", name: "house" } });
        expect(attrsOf(html, "svg").viewBox).toBe(`0 0 ${solid.house} 512`);
    });

    test("defaults to an aria-hidden icon sized to the current font size", () => {
        const attrs = attrsOf(render(FaImage, { icon: { type: "brands", name: "github" } }).html, "svg");
        expect(attrs).toMatchObject({ "aria-hidden": "true", height: "1em", xmlns: "http://www.w3.org/2000/svg" });
    });

    test.each([
        ["brands", "github"],
        ["regular", "user"],
        ["solid", "house"],
    ])("references the %s sprite", (type, name) => {
        const { html } = render(FaImage, { icon: { type, name } });
        expect(html).toContain(`<use href="/fa/${type}.svg#${name}"></use>`);
    });

    test("lets the caller override the presentation attributes", () => {
        const attrs = attrsOf(render(FaImage, { icon: { type: "solid", name: "house" }, height: "2em", className: "icon", "aria-hidden": false }).html, "svg");
        expect(attrs.height).toBe("2em");
        expect(attrs.class).toBe("icon");
        expect(attrs["aria-hidden"]).toBe("false");
    });

    test("registers the icon so the build bundles only the sprites in use", () => {
        const { registry } = render(FaImage, { icon: { type: "solid", name: "house" } });
        expect([...registry.icon]).toEqual(["solid/house"]);
    });

    test("collects not-exist for an unknown icon but still renders", () => {
        const { html, errors } = render(FaImage, { icon: { type: "solid", name: "nosuch" } });
        expect(errors).toEqual([{ cause: "broken-image-src", type: "not-exist", from: "solid/nosuch" }]);
        expect(html).toContain("<use");
    });

    test("emits no inline style or event handler", () => {
        const { html } = render(FaImage, { icon: { type: "solid", name: "house" } });
        expect(scanMarkup(html, "faimage")).toEqual([]);
    });
});
