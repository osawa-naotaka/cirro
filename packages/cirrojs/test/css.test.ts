import { describe, expect, test } from "vitest";
import { at, atStatement, genCssFn, ss, stringifyCss, toKeyframes, toStyle } from "../src/lib/css.ts";
import type { Registry, RuleNode } from "../src/registry/registry.common.ts";
import { runWithRegistry } from "../src/registry/registry.ts";

// toStyle / toKeyframes はレンダリングコンテキスト（AsyncLocalStorage）を要求するため、
// 登録とその結果（designator・registry）をまとめて取り出すハーネスを用意する。
function register<T>(fn: () => T): { result: T; registry: Registry; globals: Set<string> } {
    const { result, registry, globalRuleDesignators } = runWithRegistry(fn);
    return { result, registry, globals: globalRuleDesignators };
}

// 登録された CSS を文字列化して返す（@charset のプリアンブルは検証しやすさのため落とす）。
function css(fn: () => unknown): string {
    const { registry } = register(fn);
    return stringifyCss(registry).replace(/^@charset "utf-8";\n/, "");
}

// 単一ノードを登録した結果の CSS を返す。
function cssOf(node: RuleNode): string {
    return css(() => toStyle(node));
}

describe("toStyle: designator", () => {
    test("prefixes the designator with the given name, defaulting to cirro", () => {
        const { result } = register(() => toStyle(ss({ color: "red" })));
        expect(result).toMatch(/^cirro-[0-9a-f]+$/);

        const { result: named } = register(() => toStyle(ss({ color: "red" }), { name: "button" }));
        expect(named).toMatch(/^button-[0-9a-f]+$/);
    });

    test("is deterministic for the same content and differs for different content", () => {
        const a = register(() => toStyle(ss({ color: "red" }))).result;
        const b = register(() => toStyle(ss({ color: "red" }))).result;
        const c = register(() => toStyle(ss({ color: "blue" }))).result;
        expect(a).toBe(b);
        expect(a).not.toBe(c);
    });

    test("registers the rule under the designator as its registry key", () => {
        const { result, registry } = register(() => toStyle(ss({ color: "red" })));
        expect([...registry.style.keys()]).toEqual([result]);
    });

    test("identical content registered twice collapses into a single rule", () => {
        const { registry } = register(() => {
            toStyle(ss({ color: "red" }));
            toStyle(ss({ color: "red" }));
        });
        expect(registry.style.size).toBe(1);
    });
});

describe("stringifyCss: output shape", () => {
    test("emits the @charset preamble first", () => {
        const { registry } = register(() => toStyle(ss({ color: "red" })));
        expect(stringifyCss(registry).startsWith('@charset "utf-8";\n')).toBe(true);
    });

    test("places at-statements before rules regardless of registration order", () => {
        const out = css(() => {
            toStyle(ss({ color: "red" }));
            toStyle(atStatement("@layer base, main"));
        });
        expect(out).toMatch(/^@layer base, main;\n\.cirro-[0-9a-f]+ \{ color: red; \}\n$/);
    });

    test("converts underscores in property names to hyphens", () => {
        expect(cssOf(ss({ box_sizing: "border-box" }))).toContain("box-sizing: border-box;");
    });

    test("joins array values with spaces", () => {
        expect(cssOf(ss({ margin: ["0", "auto"] }))).toContain("margin: 0 auto;");
    });

    test("keeps custom properties as written", () => {
        expect(cssOf(ss({ "--brand": "#123456" }))).toContain("--brand: #123456;");
    });

    test("emits an empty declaration block without a stray body", () => {
        expect(cssOf(ss({}))).toMatch(/^\.cirro-[0-9a-f]+ \{ {2}\}\n$/);
    });

    test("emits nested rules inside the parent block (native CSS nesting)", () => {
        const out = cssOf(ss({ color: "red" }, undefined, ss({ color: "blue" }, { selector: "& > a" })));
        expect(out).toMatch(/^\.cirro-[0-9a-f]+ \{ color: red; & > a \{ color: blue; \} \}\n$/);
    });

    test("emits a hand-built rule whose children are omitted (children is optional in RuleNode)", () => {
        const out = cssOf({ type: "style", selector: "$", declarations: { color: "red" } });
        expect(out).toMatch(/^\.cirro-[0-9a-f]+ \{ color: red; \}\n$/);
    });

    test("emits at-blocks with their children", () => {
        const out = cssOf(at("@media (width >= 40rem)", ss({ color: "red" })));
        expect(out).toMatch(/^@media \(width >= 40rem\) \{ \.cirro-[0-9a-f]+ \{ color: red; \} \}\n$/);
    });

    test("rejects an at-statement nested inside a block (top level only)", () => {
        const { registry } = register(() => toStyle(at("@layer main", atStatement("@layer a, b"))));
        expect(() => stringifyCss(registry)).toThrow(/only allowed at the top level/);
    });
});

describe("selector resolution: $ and &", () => {
    test("replaces $ with the generated class selector", () => {
        const out = cssOf(ss({ color: "red" }, { selector: "$ > li" }));
        expect(out).toMatch(/^\.cirro-[0-9a-f]+ > li \{ color: red; \}\n$/);
    });

    test("replaces every occurrence of $ in the selector", () => {
        const { result } = register(() => toStyle(ss({ color: "red" }, { selector: "$ + $" })));
        expect(cssOf(ss({ color: "red" }, { selector: "$ + $" }))).toContain(`.${result} + .${result}`);
    });

    test("does not touch the $= attribute suffix matcher", () => {
        expect(cssOf(ss({ color: "red" }, { selector: '$ a[href$=".pdf"]' }))).toContain('a[href$=".pdf"]');
    });

    test("resolves $ inside at-block children", () => {
        const { result } = register(() => toStyle(at("@layer main", ss({ color: "red" }, { selector: "$ p" }))));
        expect(cssOf(at("@layer main", ss({ color: "red" }, { selector: "$ p" })))).toContain(`.${result} p`);
    });

    test("rejects & in a non-nested selector (no parent exists there)", () => {
        expect(() => register(() => toStyle(ss({ color: "red" }, { selector: "& > a" })))).toThrow(/"&" is not allowed in a non-nested selector/);
    });

    test("rejects $ in a nested selector (it would silently become a descendant selector)", () => {
        expect(() => register(() => toStyle(ss({ color: "red" }, undefined, ss({ color: "blue" }, { selector: "$ a" }))))).toThrow(
            /"\$" is not allowed in a nested selector/,
        );
    });

    test("allows the $= matcher in a nested selector", () => {
        const out = cssOf(ss({ color: "red" }, undefined, ss({ color: "blue" }, { selector: '& a[href$=".pdf"]' })));
        expect(out).toContain('& a[href$=".pdf"]');
    });
});

describe("global rule detection", () => {
    // グローバル規則（ページ全体へ効く規則）は dev と build で CSS が食い違いうるため、
    // designator が globalRuleDesignators に積まれることを確認する。
    function globalsOf(node: RuleNode): string[] {
        const { result, globals } = register(() => toStyle(node));
        return [...globals].map((g) => (g === result ? "self" : g));
    }

    test("treats an at-statement as global", () => {
        expect(globalsOf(atStatement("@layer base, main"))).toEqual(["self"]);
    });

    test("treats a selector without $ as global", () => {
        expect(globalsOf(ss({ color: "red" }, { selector: "h1" }))).toEqual(["self"]);
    });

    test("does not treat a $-scoped selector as global", () => {
        expect(globalsOf(ss({ color: "red" }, { selector: "$:hover" }))).toEqual([]);
    });

    test("treats a selector list with one non-$ member as global", () => {
        expect(globalsOf(ss({ color: "red" }, { selector: "$, h1" }))).toEqual(["self"]);
    });

    test("does not split a selector list inside :is() parentheses", () => {
        expect(globalsOf(ss({ color: "red" }, { selector: "$:is(h1, h2)" }))).toEqual([]);
    });

    test("does not split a comma inside an attribute selector or a quoted string", () => {
        expect(globalsOf(ss({ color: "red" }, { selector: '$[data-x="a,b"]' }))).toEqual([]);
    });

    test("does not count the $= attribute matcher as a self reference", () => {
        // a[href$=".pdf"] は自クラスにスコープされないためグローバル規則である。
        expect(globalsOf(ss({ color: "red" }, { selector: 'a[href$=".pdf"]' }))).toEqual(["self"]);
    });

    test("still recognizes a scoped selector that also uses the $= matcher", () => {
        expect(globalsOf(ss({ color: "red" }, { selector: '$ a[href$=".pdf"]' }))).toEqual([]);
    });

    test("treats a selector list as global when a $=-only member is scoped nowhere", () => {
        expect(globalsOf(ss({ color: "red" }, { selector: '$ a, a[href$=".pdf"]' }))).toEqual(["self"]);
    });

    test("ignores nested children (they are scoped to the parent selector)", () => {
        expect(globalsOf(ss({ color: "red" }, { selector: "$" }, ss({ color: "blue" }, { selector: "h1" })))).toEqual([]);
    });

    test("treats an at-block as global when any child is global", () => {
        expect(globalsOf(at("@layer base", ss({ color: "red" }, { selector: "h1" })))).toEqual(["self"]);
        expect(globalsOf(at("@layer base", ss({ color: "red" }, { selector: "$" })))).toEqual([]);
    });
});

describe("injection defense: selectors and at-rules", () => {
    test.each([
        ["closing brace", "$ } .evil {"],
        ["semicolon", "$; color: red"],
        ["comment opener", "$ /* x"],
    ])("rejects a selector containing %s", (_name, selector) => {
        const { registry } = register(() => toStyle(ss({ color: "red" }, { selector })));
        expect(() => stringifyCss(registry)).toThrow(/forbidden sequence/);
    });

    test("rejects a selector longer than 512 characters", () => {
        const { registry } = register(() => toStyle(ss({ color: "red" }, { selector: `$${"a".repeat(512)}` })));
        expect(() => stringifyCss(registry)).toThrow(/too long/);
    });

    test("rejects an at-rule prelude longer than 512 characters", () => {
        const { registry } = register(() => toStyle(at(`@media (min-width: ${"0".repeat(512)}px)`, ss({ color: "red" }))));
        expect(() => stringifyCss(registry)).toThrow(/too long/);
    });

    test.each([
        ["missing @", "layer main"],
        ["non-identifier after @", "@1media"],
    ])("rejects an at-rule prelude with %s", (_name, prelude) => {
        const { registry } = register(() => toStyle(at(prelude, ss({ color: "red" }))));
        expect(() => stringifyCss(registry)).toThrow(/must start with "@"/);
    });

    test.each([
        ["brace", "@media x { } .evil {"],
        ["semicolon", "@media x;"],
        ["comment opener", "@media /* x"],
    ])("rejects an at-rule prelude containing a %s", (_name, prelude) => {
        const { registry } = register(() => toStyle(at(prelude, ss({ color: "red" }))));
        expect(() => stringifyCss(registry)).toThrow(/forbidden sequence/);
    });

    test("rejects an at-statement with a forbidden sequence", () => {
        const { registry } = register(() => toStyle(atStatement("@layer a; } .evil {")));
        expect(() => stringifyCss(registry)).toThrow(/forbidden sequence/);
    });
});

describe("injection defense: declarations", () => {
    test("rejects a property name outside the allow list", () => {
        const { registry } = register(() => toStyle(ss({ evil: "x" } as never)));
        expect(() => stringifyCss(registry)).toThrow(/is not a valid CSS property name/);
    });

    test("rejects a property name longer than 128 characters", () => {
        const { registry } = register(() => toStyle(ss({ [`--${"a".repeat(128)}`]: "x" } as never)));
        expect(() => stringifyCss(registry)).toThrow(/too long/);
    });

    test.each([
        ["number", 1],
        ["object", {}],
        ["null", null],
    ])("rejects a non-string property value (%s)", (_name, value) => {
        const { registry } = register(() => toStyle(ss({ color: value } as never)));
        expect(() => stringifyCss(registry)).toThrow(/is not a string/);
    });

    test("rejects a property value longer than 512 characters", () => {
        const { registry } = register(() => toStyle(ss({ color: "a".repeat(513) })));
        expect(() => stringifyCss(registry)).toThrow(/too long/);
    });

    test("rejects a non-string item inside an array value", () => {
        const { registry } = register(() => toStyle(ss({ margin: ["0", 1] } as never)));
        expect(() => stringifyCss(registry)).toThrow(/is not a string/);
    });

    test("rejects an over-long item inside an array value", () => {
        const { registry } = register(() => toStyle(ss({ margin: ["0", "a".repeat(513)] })));
        expect(() => stringifyCss(registry)).toThrow(/too long/);
    });
});

describe("toKeyframes", () => {
    test("returns a deterministic name prefixed with cirro-kf", () => {
        const frames = [ss({ opacity: "0" }, { selector: "from" }), ss({ opacity: "1" }, { selector: "to" })];
        const a = register(() => toKeyframes(frames)).result;
        const b = register(() => toKeyframes(frames)).result;
        expect(a).toMatch(/^cirro-kf-[0-9a-f]+$/);
        expect(a).toBe(b);
    });

    test("honors the name option", () => {
        const { result } = register(() => toKeyframes([ss({ opacity: "0" }, { selector: "from" })], { name: "fade" }));
        expect(result).toMatch(/^fade-[0-9a-f]+$/);
    });

    test("registers an @keyframes block under the animation name", () => {
        const out = css(() => toKeyframes([ss({ opacity: "0" }, { selector: "from" }), ss({ opacity: "1" }, { selector: "to" })]));
        expect(out).toMatch(/^@keyframes cirro-kf-[0-9a-f]+ \{ from \{ opacity: 0; \} to \{ opacity: 1; \} \}\n$/);
    });

    test.each([
        ["from", "from"],
        ["to", "to"],
        ["percentage", "50%"],
        ["fractional percentage", "12.5%"],
        ["comma-separated list", "from, 50%, to"],
    ])("accepts the keyframe selector %s", (_name, selector) => {
        expect(() => register(() => toKeyframes([ss({ opacity: "0" }, { selector })]))).not.toThrow();
    });

    test.each([
        ["a class selector", ".x"],
        ["a bare number", "50"],
        ["an element selector", "start"],
        ["a trailing comma", "from,"],
    ])("rejects the keyframe selector %s", (_name, selector) => {
        expect(() => register(() => toKeyframes([ss({ opacity: "0" }, { selector })]))).toThrow(/must be "from", "to"/);
    });

    test("rejects a non-style frame", () => {
        expect(() => register(() => toKeyframes([at("@media x", ss({ opacity: "0" }, { selector: "from" }))]))).toThrow(/accepts only style rules/);
    });

    test("rejects nested rules inside a frame", () => {
        expect(() => register(() => toKeyframes([ss({ opacity: "0" }, { selector: "from" }, ss({ opacity: "1" }, { selector: "& a" }))]))).toThrow(
            /must not contain nested rules/,
        );
    });

    test("wraps the block with the wrap option", () => {
        const out = css(() => toKeyframes([ss({ opacity: "0" }, { selector: "from" })], { wrap: (injected) => at("@layer main", injected()) }));
        expect(out).toMatch(/^@layer main \{ @keyframes cirro-kf-[0-9a-f]+ \{ from \{ opacity: 0; \} \} \}\n$/);
    });
});

describe("genCssFn", () => {
    test("wraps the generated rule with the injected at-rule", () => {
        const cssFn = genCssFn((injected) => at("@layer main", injected()));
        const out = css(() => cssFn({ color: "red" }));
        expect(out).toMatch(/^@layer main \{ \.cirro-[0-9a-f]+ \{ color: red; \} \}\n$/);
    });

    test("returns the designator and honors name / selector options", () => {
        const cssFn = genCssFn();
        const { result } = register(() => cssFn({ color: "red" }, { name: "button", selector: "$ > span" }));
        expect(result).toMatch(/^button-[0-9a-f]+$/);
        expect(css(() => cssFn({ color: "red" }, { name: "button", selector: "$ > span" }))).toContain(`.${result} > span`);
    });

    test("wrapping changes the designator (the wrapper is part of the hashed node)", () => {
        const plain = register(() => genCssFn()({ color: "red" })).result;
        const wrapped = register(() => genCssFn((injected) => at("@layer main", injected()))({ color: "red" })).result;
        expect(plain).not.toBe(wrapped);
    });
});
