import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ErrorInfo } from "../src/registry/registry.common.ts";
import { reportErrors } from "../src/runtime/report.ts";

// cause ごとに 1 件以上のサンプルを持つ表。Record 型なので、ErrorInfo に新しい cause を
// 足すとこの表が型エラーになり、報告のテスト漏れがコンパイル時に露見する。
const samples: { [C in ErrorInfo["cause"]]: Extract<ErrorInfo, { cause: C }>[] } = {
    "broken-link": [
        { cause: "broken-link", type: "malformed", link: "./about" },
        { cause: "broken-link", type: "not-found", link: "/nope" },
    ],
    "broken-image-src": [
        { cause: "broken-image-src", type: "malformed", from: "./x.png" },
        { cause: "broken-image-src", type: "unsupported", from: "pkg:/x.png" },
        { cause: "broken-image-src", type: "not-found", from: "/images/nope.png" },
        { cause: "broken-image-src", type: "not-exist", from: "solid/nosuch" },
    ],
    "missing-site": [{ cause: "missing-site", feature: "<Ogp>" }],
    island: [
        { cause: "island", type: "not-configured", island: "counter" },
        { cause: "island", type: "unknown-name", island: "nope" },
    ],
    "island-props": [{ cause: "island-props", island: "counter", path: "props.onClick", kind: "function" }],
    "markdown-ref": [
        { cause: "markdown-ref", attr: "href", type: "malformed", ref: "./a" },
        { cause: "markdown-ref", attr: "href", type: "not-found", ref: "/nope" },
        { cause: "markdown-ref", attr: "src", type: "malformed", ref: "./a.png" },
        { cause: "markdown-ref", attr: "src", type: "not-found", ref: "/nope.png" },
    ],
};

const all: ErrorInfo[] = Object.values(samples).flat();

// エラーの識別に使う値（メッセージに必ず現れるべきもの）。
function subject(e: ErrorInfo): string {
    switch (e.cause) {
        case "broken-link":
            return e.link;
        case "broken-image-src":
            return e.from;
        case "missing-site":
            return e.feature;
        case "island":
        case "island-props":
            return e.island;
        case "markdown-ref":
            return e.ref;
    }
}

describe("reportErrors", () => {
    let log: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterEach(() => {
        log.mockRestore();
    });

    test("prints nothing for an empty error list", () => {
        reportErrors([]);
        expect(log).not.toHaveBeenCalled();
    });

    test.each(
        all.map((e) => [`${e.cause}/${"type" in e ? e.type : "-"}${"attr" in e ? ` (${e.attr})` : ""}`, e] as const),
    )("prints a message naming the subject for %s", (_name, error) => {
        reportErrors([error]);
        expect(log).toHaveBeenCalledTimes(1);
        expect(String(log.mock.calls[0]?.[0])).toContain(subject(error));
    });

    test("prints one line per error and reports them all in one pass", () => {
        reportErrors(all);
        expect(log).toHaveBeenCalledTimes(all.length);
    });

    test("distinguishes markdown-ref by attribute name", () => {
        reportErrors([{ cause: "markdown-ref", attr: "src", type: "not-found", ref: "/x.png" }]);
        expect(String(log.mock.calls[0]?.[0])).toContain('src="/x.png"');
    });

    test("distinguishes the two link violation types", () => {
        reportErrors([
            { cause: "broken-link", type: "malformed", link: "./a" },
            { cause: "broken-link", type: "not-found", link: "/a" },
        ]);
        expect(String(log.mock.calls[0]?.[0])).toMatch(/malformed/);
        expect(String(log.mock.calls[1]?.[0])).toMatch(/not found/);
    });

    test("guides the user to the fix for configuration mistakes", () => {
        // 報告は原因だけでなく直し方まで示す方針（09_LINK_SAFETY.md 4.5）。
        reportErrors([{ cause: "island", type: "not-configured", island: "counter" }]);
        expect(String(log.mock.calls[0]?.[0])).toContain("cirro({ islands");

        log.mockClear();
        reportErrors([{ cause: "missing-site", feature: "<Ogp>" }]);
        expect(String(log.mock.calls[0]?.[0])).toContain("defineSite(");
    });
});
