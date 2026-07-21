import type { Schema } from "hast-util-sanitize";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { runWithRegistry } from "../src/registry/registry.ts";
import { createMarkdownProcessor, markdownToText } from "../src/server/markdown.tsx";

// render の戻り値（React 要素）を HTML 文字列として取り出す。<div> のラッパは剥がす。
function html(md: string, config?: Parameters<typeof createMarkdownProcessor>[0], options?: { className?: string }): string {
    const { render } = createMarkdownProcessor(config);
    // 参照検証はここでの関心事ではないため、コンテキスト外で描画してスキップさせる
    // （13_MARKDOWN_REF_CHECK.md 4.5。検証自体は markdown-ref.test.ts が受け持つ）。
    return renderToStaticMarkup(render(md, options).body);
}

describe("markdown sanitize: raw HTML", () => {
    test.each([
        ["script element", "<script>alert(1)</script>"],
        ["style element", "<style>body { color: red }</style>"],
        ["iframe", '<iframe src="https://evil.example.com"></iframe>'],
        ["event handler attribute", '<img src="/x.png" onerror="alert(1)">'],
        ["style attribute", '<p style="color:red">x</p>'],
        ["object", '<object data="/x.swf"></object>'],
        ["form", '<form action="/x"><input name="a"></form>'],
    ])("drops raw HTML: %s", (_name, md) => {
        const out = html(md);
        expect(out).not.toMatch(/<script|<style|<iframe|<object|<form|<input/i);
        expect(out).not.toMatch(/\son[a-z]+=/i);
        expect(out).not.toMatch(/\sstyle=/i);
    });

    test("keeps the text content of markdown around dropped raw HTML", () => {
        expect(html("before\n\n<script>alert(1)</script>\n\nafter")).toContain("<p>before</p>");
        expect(html("before\n\n<script>alert(1)</script>\n\nafter")).toContain("<p>after</p>");
    });
});

describe("markdown sanitize: URL schemes", () => {
    test.each([
        ["javascript", "[x](javascript:alert(1))"],
        ["uppercase javascript", "[x](JaVaScRiPt:alert(1))"],
        ["data", "[x](data:text/html,<script>alert(1)</script>)"],
        ["vbscript", "[x](vbscript:msgbox(1))"],
    ])("strips the href of a %s: link", (_name, md) => {
        const out = html(md);
        expect(out).not.toMatch(/href="[^"]*:/i);
    });

    test.each([
        ["javascript", "![x](javascript:alert(1))"],
        ["data", "![x](data:text/html,<script>alert(1)</script>)"],
    ])("strips the src of a %s: image", (_name, md) => {
        const out = html(md);
        expect(out).not.toMatch(/src="[^"]*:/i);
    });

    test.each([
        ["https link", "[x](https://example.com/a)", 'href="https://example.com/a"'],
        ["mailto link", "[x](mailto:a@example.com)", 'href="mailto:a@example.com"'],
        ["root-relative link", "[x](/about)", 'href="/about"'],
        ["https image", "![x](https://example.com/a.png)", 'src="https://example.com/a.png"'],
    ])("keeps a %s", (_name, md, expected) => {
        expect(html(md)).toContain(expected);
    });
});

describe("markdown sanitize: user plugins cannot cross the defense line", () => {
    // sanitize はユーザー層より下流に固定されている（markdown.tsx のパイプライン構成）。
    // ユーザー plugin が何を生成しても、許可リストのサブセットだけが出力される。
    function injectRehype(node: unknown) {
        return () => (tree: { children: unknown[] }) => {
            tree.children.push(node);
        };
    }

    test("a script element injected by a user rehype plugin is removed", () => {
        const out = html("text", {
            rehypePlugins: [injectRehype({ type: "element", tagName: "script", properties: {}, children: [{ type: "text", value: "alert(1)" }] })],
        });
        expect(out).not.toContain("<script");
    });

    test("an event handler attribute injected by a user rehype plugin is removed", () => {
        const out = html("text", {
            rehypePlugins: [injectRehype({ type: "element", tagName: "a", properties: { href: "/x", onClick: "alert(1)" }, children: [] })],
        });
        expect(out).toContain('href="/x"');
        expect(out).not.toMatch(/onclick/i);
    });

    test("a style attribute injected by a user rehype plugin is removed", () => {
        const out = html("text", {
            rehypePlugins: [injectRehype({ type: "element", tagName: "p", properties: { style: "color:red" }, children: [] })],
        });
        expect(out).not.toMatch(/\sstyle=/i);
    });

    test("a javascript: href injected by a user rehype plugin is removed", () => {
        const out = html("text", {
            rehypePlugins: [injectRehype({ type: "element", tagName: "a", properties: { href: "javascript:alert(1)" }, children: [] })],
        });
        expect(out).not.toMatch(/href="javascript:/i);
    });
});

describe("markdown sanitize: schema extension", () => {
    test("sanitizeSchema can widen the allow list", () => {
        const withRel = (defaults: Schema): Schema => ({
            ...defaults,
            attributes: { ...defaults.attributes, a: [...(defaults.attributes?.a ?? []), "rel"] },
        });
        const inject = () => (tree: { children: unknown[] }) => {
            tree.children.push({ type: "element", tagName: "a", properties: { href: "/x", rel: "nofollow" }, children: [] });
        };
        expect(html("text", { rehypePlugins: [inject] })).not.toContain('rel="nofollow"');
        expect(html("text", { rehypePlugins: [inject], sanitizeSchema: withRel })).toContain('rel="nofollow"');
    });

    test("id is not prefixed with user-content- (clobber protection is lifted for id only)", () => {
        // 見出し id は remark-export-toc が決定的に採番する値であり、コンテンツ由来ではない。
        const out = html("## Section", { toc: true });
        expect(out).toContain('id="heading-1"');
        expect(out).not.toContain("user-content-");
    });
});

describe("markdown: toc", () => {
    test("returns an empty toc when disabled", () => {
        const { render } = createMarkdownProcessor();
        expect(render("## A\n\n## B").toc).toEqual([]);
    });

    test("extracts headings with ids matching the emitted anchors", () => {
        const { render } = createMarkdownProcessor({ toc: true });
        const { toc, body } = render("## A\n\n### B\n\n## C");
        // id は見出しの階層を反映して採番される（h2 → heading-1, その下の h3 → heading-1-1）。
        expect(toc.map((t) => t.id)).toEqual(["heading-1", "heading-1-1", "heading-2"]);
        const out = renderToStaticMarkup(body);
        for (const t of toc) {
            expect(out).toContain(`id="${t.id}"`);
        }
    });

    test("honors the prefix and startLevel options", () => {
        const { render } = createMarkdownProcessor({ toc: { prefix: "sec", startLevel: 3 } });
        const { toc } = render("## A\n\n### B");
        expect(toc.map((t) => t.id)).toEqual(["sec-1"]);
    });
});

describe("markdown: highlight", () => {
    test("adds language classes and emits no inline style (style-src 'self' stays intact)", () => {
        const out = html("```js\nconst a = 1;\n```", { highlight: true });
        expect(out).toContain("language-js");
        expect(out).toMatch(/class="token/);
        expect(out).not.toMatch(/\sstyle=/i);
    });

    test("leaves code blocks unhighlighted when disabled", () => {
        const out = html("```js\nconst a = 1;\n```");
        expect(out).not.toMatch(/class="token/);
    });
});

describe("markdown: rendering surface", () => {
    test("applies className to the wrapper div", () => {
        expect(html("text", undefined, { className: "prose" })).toMatch(/^<div class="prose">/);
    });

    test("Markdown component renders the same body as render()", () => {
        const { Markdown, render } = createMarkdownProcessor();
        expect(renderToStaticMarkup(Markdown({ source: "# T" }))).toBe(renderToStaticMarkup(render("# T").body));
    });

    test("renders inside a render context without disturbing the registry", () => {
        const { registry, errors } = runWithRegistry(() => html("# T"));
        expect(registry.style.size).toBe(0);
        expect(errors).toEqual([]);
    });
});

describe("markdownToText", () => {
    test("strips markdown syntax and joins blocks with newlines", () => {
        expect(markdownToText("# Title\n\nsome **bold** text")).toBe("Title\nsome bold text");
    });

    test("drops link syntax but keeps the label", () => {
        expect(markdownToText("see [the docs](/docs) now")).toBe("see the docs now");
    });

    test("returns an empty string for empty input", () => {
        expect(markdownToText("")).toBe("");
    });
});
