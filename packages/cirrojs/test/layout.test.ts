import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { createLayout, cx, defineCascadeLayer, type Layout, type LayoutTheme, resetCss } from "../src/layout/layout.tsx";
import { at, genCssFn, ss, stringifyCss, toStyle } from "../src/lib/css.ts";
import { runWithRegistry } from "../src/registry/registry.ts";

// レイアウト関数は css() を呼ぶためレンダリングコンテキストを要求する。
// 戻り値（クラス名の束）と、登録された CSS の両方を取り出す。
function build<T>(fn: (l: Layout) => T, theme?: LayoutTheme): { result: T; css: string } {
    const { result, registry } = runWithRegistry(() => fn(createLayout(theme)));
    return { result, css: stringifyCss(registry) };
}

// 単一クラスの宣言ブロックの中身を取り出す（ネストの無いルールにだけ使う）。
function declOf(css: string, designator: string): string | undefined {
    return new RegExp(`\\.${designator} \\{ ([^{}]*) \\}`).exec(css)?.[1];
}

// クラス名の束を配列にする。
function classes(result: string): string[] {
    return result.split(" ").filter(Boolean);
}

describe("cx", () => {
    test("joins truthy class names with a single space", () => {
        expect(cx("a", "b", "c")).toBe("a b c");
    });

    test.each([
        ["empty string", ""],
        ["false", false as const],
        ["null", null],
        ["undefined", undefined],
    ])("drops %s", (_name, value) => {
        expect(cx("a", value, "b")).toBe("a b");
    });

    test("returns an empty string when everything is falsy", () => {
        expect(cx(false, null, undefined, "")).toBe("");
    });
});

describe("createLayout: output layer", () => {
    test("emits rules into @layer low by default", () => {
        // component レシピ（@layer main）より下に置くことで、component が layout を上書きできる。
        const { result, css } = build((l) => l.stack());
        expect(css).toContain(`@layer low { .${result} {`);
    });

    test("honors a css function injected through the theme", () => {
        const { result, css } = build((l) => l.stack(), { css: genCssFn((fn) => at("@layer custom", fn())) });
        expect(css).toContain(`@layer custom { .${result} {`);
        expect(css).not.toContain("@layer low");
    });
});

describe("createLayout: primitives", () => {
    test("stack lays out a flex column with the default gap", () => {
        const { result, css } = build((l) => l.stack());
        expect(result).toMatch(/^stack-[0-9a-f]+$/);
        expect(declOf(css, result)).toBe("display: flex; flex-direction: column; gap: 1rem;");
    });

    test("cluster wraps a flex row with the default alignment", () => {
        const { result, css } = build((l) => l.cluster());
        expect(result).toMatch(/^cluster-[0-9a-f]+$/);
        expect(declOf(css, result)).toBe("display: flex; flex-wrap: wrap; gap: 1rem; justify-content: flex-start; align-items: center;");
    });

    test("center constrains the measure and centers with auto inline margins", () => {
        const { result, css } = build((l) => l.center());
        expect(classes(result)).toHaveLength(1);
        expect(declOf(css, result)).toBe("box-sizing: border-box; margin-inline: auto; max-inline-size: 60ch;");
    });

    test.each([
        ["gutters", { gutters: "1rem" }, 2],
        ["intrinsic", { intrinsic: true }, 2],
        ["andText", { andText: true }, 2],
        ["all options", { gutters: "1rem", intrinsic: true, andText: true }, 4],
    ])("center adds one class per enabled option (%s)", (_name, opts, count) => {
        const { result } = build((l) => l.center(opts));
        expect(classes(result)).toHaveLength(count);
    });

    test("grid uses auto-fit tracks clamped to 100% of the container", () => {
        const { result, css } = build((l) => l.grid());
        expect(declOf(css, result)).toBe("display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));");
    });

    test("switcher returns the container plus three child rules", () => {
        const { result, css } = build((l) => l.switcher());
        const [container, item, last, after] = classes(result);
        expect(classes(result)).toHaveLength(4);
        expect(declOf(css, container ?? "")).toBe("display: flex; flex-wrap: wrap; gap: 1rem;");
        expect(css).toContain(`.${item} > * { flex-grow: 1; flex-basis: calc((30rem - 100%) * 999); }`);
        // 既定 limit は 4。5 個目以降が現れたら全部を縦積みへ倒す。
        expect(css).toContain(`.${last} > :nth-last-child(n+5) { flex-basis: 100%; }`);
        expect(css).toContain(`.${after} > :nth-last-child(n+5) ~ * { flex-basis: 100%; }`);
    });

    test("switcher reflects the limit option in the nth-last-child threshold", () => {
        const { result, css } = build((l) => l.switcher({ limit: 2 }));
        expect(css).toContain(`.${classes(result)[2]} > :nth-last-child(n+3) { flex-basis: 100%; }`);
    });

    test("sidebar returns three distinct slots", () => {
        const { result, css } = build((l) => l.sidebar());
        expect(new Set(Object.values(result)).size).toBe(3);
        expect(declOf(css, result.root)).toBe("display: flex; flex-wrap: wrap; gap: 1rem;");
        expect(declOf(css, result.side)).toBe("flex-grow: 1; flex-basis: 30ch;");
        expect(declOf(css, result.content)).toBe("flex-grow: 999; flex-basis: 0; min-inline-size: 65ch;");
    });

    test("cover excludes the centered slot from the gap rules", () => {
        const { result, css } = build((l) => l.cover());
        expect(result.centered).toMatch(/^cover-centered-[0-9a-f]+$/);
        expect(declOf(css, result.centered)).toBe("margin-block: auto;");
        // gap 系の 3 規則は centered を :not() で除外する。
        expect(css).toContain(`> :not(.${result.centered}) { margin-block: 1rem; }`);
        expect(css).toContain(`> :first-child:not(.${result.centered}) { margin-block-start: 0; }`);
        expect(css).toContain(`> :last-child:not(.${result.centered}) { margin-block-end: 0; }`);
        expect(classes(result.root)).toHaveLength(4);
    });

    test("frame fixes the aspect ratio and covers with the child media", () => {
        const { result, css } = build((l) => l.frame());
        const [root, media] = classes(result);
        expect(declOf(css, root ?? "")).toBe("aspect-ratio: 16 / 9; overflow: hidden; display: flex; justify-content: center; align-items: center;");
        expect(css).toContain(`.${media} > img, .${media} > video { inline-size: 100%; block-size: 100%; object-fit: cover; }`);
    });

    test("reel scrolls horizontally and keeps its children from shrinking", () => {
        const { result, css } = build((l) => l.reel({ itemWidth: "20rem" }));
        const [root, child] = classes(result);
        expect(classes(result)).toHaveLength(3);
        expect(declOf(css, root ?? "")).toBe("display: flex; block-size: auto; overflow-x: auto; overflow-y: hidden; gap: 1rem;");
        expect(css).toContain(`.${child} > * { flex: 0 0 20rem; }`);
    });

    test("imposter centers absolutely and only adds the contain rule on request", () => {
        const { result, css } = build((l) => l.imposter());
        expect(classes(result)).toHaveLength(1);
        expect(declOf(css, result)).toBe("position: absolute; inset-block-start: 50%; inset-inline-start: 50%; transform: translate(-50%, -50%);");

        const contained = build((l) => l.imposter({ contain: true, margin: "1rem" }));
        expect(classes(contained.result)).toHaveLength(2);
        expect(declOf(contained.css, classes(contained.result)[1] ?? "")).toBe(
            "overflow: auto; max-inline-size: calc(100% - (1rem * 2)); max-block-size: calc(100% - (1rem * 2));",
        );
    });

    test("imposter switches to fixed positioning", () => {
        const { result, css } = build((l) => l.imposter({ fixed: true }));
        expect(declOf(css, result)).toContain("position: fixed;");
    });

    test("box pads with border-box sizing and adds no border by default", () => {
        const { result, css } = build((l) => l.box());
        expect(classes(result)).toHaveLength(1);
        expect(declOf(css, result)).toBe("box-sizing: border-box; padding: 1rem;");

        const bordered = build((l) => l.box({ border: "1px solid #ccc" }));
        expect(classes(bordered.result)).toHaveLength(2);
        expect(declOf(bordered.css, classes(bordered.result)[1] ?? "")).toBe("border: 1px solid #ccc;");
    });
});

describe("createLayout: defaults injection", () => {
    test("theme defaults override the built-in defaults", () => {
        const { result, css } = build((l) => l.stack(), { defaults: { gap: "2rem" } });
        expect(declOf(css, result)).toContain("gap: 2rem;");
    });

    test("a per-primitive default wins over the base gap", () => {
        const { result, css } = build((l) => l.stack(), { defaults: { gap: "2rem", stackGap: "3rem" } });
        expect(declOf(css, result)).toContain("gap: 3rem;");
    });

    test("a call option wins over every default", () => {
        const { result, css } = build((l) => l.stack({ gap: "4rem" }), { defaults: { gap: "2rem", stackGap: "3rem" } });
        expect(declOf(css, result)).toContain("gap: 4rem;");
    });

    test("the base gap is the fallback for primitives without their own default", () => {
        const { result, css } = build((l) => l.cluster(), { defaults: { gap: "2rem", stackGap: "3rem" } });
        expect(declOf(css, result)).toContain("gap: 2rem;");
    });

    test("boxPadding falls back to the base gap", () => {
        const withPadding = build((l) => l.box(), { defaults: { gap: "2rem", boxPadding: "5rem" } });
        expect(declOf(withPadding.css, withPadding.result)).toContain("padding: 5rem;");

        const withoutPadding = build((l) => l.box(), { defaults: { gap: "2rem" } });
        expect(declOf(withoutPadding.css, withoutPadding.result)).toContain("padding: 2rem;");
    });

    test("centerGutters applies to every center() that does not pass gutters", () => {
        // centerGutters は組み込み既定を持たない（指定した人だけが得る）。テーマで与えると
        // 呼び出し側が opts を書かなくても gutters クラスが増える。
        const { result, css } = build((l) => l.center(), { defaults: { centerGutters: "2rem" } });
        const [, gutters] = classes(result);
        expect(classes(result)).toHaveLength(2);
        expect(declOf(css, gutters ?? "")).toBe("padding-inline: 2rem;");
    });

    test("center() opts win over the centerGutters default", () => {
        const { result, css } = build((l) => l.center({ gutters: "1rem" }), { defaults: { centerGutters: "2rem" } });
        expect(classes(result)).toHaveLength(2);
        expect(declOf(css, classes(result)[1] ?? "")).toBe("padding-inline: 1rem;");
    });

    test("sidebar side falls back to auto when the default width is cleared", () => {
        const { result, css } = build((l) => l.sidebar(), { defaults: { sidebarSideWidth: undefined } });
        expect(declOf(css, result.side)).toBe("flex-grow: 1; flex-basis: auto;");
    });

    test("partial defaults leave the untouched ones at their built-in values", () => {
        const { result, css } = build((l) => l.center(), { defaults: { gap: "2rem" } });
        expect(declOf(css, result)).toContain("max-inline-size: 60ch;");
    });
});

describe("createLayout: determinism", () => {
    test("the same options yield the same class name across renders", () => {
        expect(build((l) => l.stack({ gap: "2rem" })).result).toBe(build((l) => l.stack({ gap: "2rem" })).result);
    });

    test("different options yield different class names", () => {
        expect(build((l) => l.stack({ gap: "2rem" })).result).not.toBe(build((l) => l.stack({ gap: "3rem" })).result);
    });

    test("the same options registered twice collapse into one rule", () => {
        const { registry } = runWithRegistry(() => {
            const l = createLayout();
            l.stack();
            l.stack();
        });
        expect(registry.style.size).toBe(1);
    });

    test("primitives with the same declarations stay distinguishable by their name prefix", () => {
        const { result } = build((l) => [l.stack(), l.cluster(), l.grid(), l.box()] as const);
        expect(result.map((c) => c.split("-")[0])).toEqual(["stack", "cluster", "grid", "box"]);
    });
});

describe("createLayout: component wrappers", () => {
    function render(fn: (l: Layout) => Parameters<typeof renderToStaticMarkup>[0]): string {
        return runWithRegistry(() => renderToStaticMarkup(fn(createLayout()))).result;
    }

    test("renders a div carrying the primitive class", () => {
        const html = render((l) => l.Stack({ children: "x" }));
        expect(html).toMatch(/^<div class="stack-[0-9a-f]+">x<\/div>$/);
    });

    test("merges a user className after the primitive class", () => {
        const html = render((l) => l.Stack({ className: "mine", children: "x" }));
        expect(html).toMatch(/class="stack-[0-9a-f]+ mine"/);
    });

    test("passes layout options through to the underlying primitive", () => {
        const { result: expected } = build((l) => l.stack({ gap: "2rem" }));
        expect(render((l) => l.Stack({ gap: "2rem", children: "x" }))).toContain(expected);
    });

    test("spreads remaining div attributes without leaking layout options", () => {
        const html = render((l) => l.Grid({ id: "g", "aria-label": "grid", min: "20rem", children: "x" }));
        expect(html).toContain('id="g"');
        expect(html).toContain('aria-label="grid"');
        expect(html).not.toContain("min=");
    });

    test.each([
        ["Stack", (l: Layout) => l.Stack({ children: "x" })],
        ["Cluster", (l: Layout) => l.Cluster({ children: "x" })],
        ["Center", (l: Layout) => l.Center({ children: "x" })],
        ["Grid", (l: Layout) => l.Grid({ children: "x" })],
        ["Switcher", (l: Layout) => l.Switcher({ children: "x" })],
        ["Frame", (l: Layout) => l.Frame({ children: "x" })],
        ["Reel", (l: Layout) => l.Reel({ children: "x" })],
        ["Imposter", (l: Layout) => l.Imposter({ children: "x" })],
        ["Box", (l: Layout) => l.Box({ children: "x" })],
    ])("%s renders a div with no style attribute", (_name, fn) => {
        // ElementOpt が style を型から外している（style-src 'self' を破る穴を塞ぐ）ことの
        // ランタイム側の確認。
        const html = render(fn);
        expect(html).toMatch(/^<div class="/);
        expect(html).not.toContain("style=");
    });

    test("renders with no props at all", () => {
        expect(render((l) => l.Box())).toMatch(/^<div class="box-[0-9a-f]+"><\/div>$/);
    });
});

describe("defineCascadeLayer / resetCss", () => {
    test("defineCascadeLayer emits the layer order statement", () => {
        const { registry } = runWithRegistry(() => defineCascadeLayer());
        expect(stringifyCss(registry)).toContain("@layer base, font, low, main, high;");
    });

    test("defineCascadeLayer accepts a custom layer list", () => {
        const { registry } = runWithRegistry(() => defineCascadeLayer("a, b"));
        expect(stringifyCss(registry)).toContain("@layer a, b;");
    });

    test("defineCascadeLayer is registered as a global rule", () => {
        const { globalRuleDesignators } = runWithRegistry(() => defineCascadeLayer());
        expect(globalRuleDesignators.size).toBe(1);
    });

    test("resetCss emits its rules into @layer base", () => {
        const { registry } = runWithRegistry(() => resetCss());
        const css = stringifyCss(registry);
        expect(registry.style.size).toBe(4);
        expect(css).toContain("@layer base { *, *:before, *:after {");
        expect(css).toContain("@layer base { a { color: inherit; text-decoration: inherit; } }");
        expect(css).toContain("@layer base { button { cursor: pointer; } }");
    });

    test("resetCss rules are all global (they are not scoped to a generated class)", () => {
        const { globalRuleDesignators } = runWithRegistry(() => resetCss());
        expect(globalRuleDesignators.size).toBe(4);
    });

    test("both are idempotent within one render", () => {
        const { registry } = runWithRegistry(() => {
            defineCascadeLayer();
            defineCascadeLayer();
            resetCss();
            resetCss();
        });
        expect(registry.style.size).toBe(5);
    });
});

describe("createLayout: interaction with plain css()", () => {
    test("layout rules and hand-written rules share one registry", () => {
        const { registry } = runWithRegistry(() => {
            createLayout().stack();
            toStyle(ss({ color: "red" }));
        });
        expect(registry.style.size).toBe(2);
    });
});
