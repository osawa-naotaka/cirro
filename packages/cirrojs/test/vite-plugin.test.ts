import { resolve } from "node:path";
import type { Plugin } from "vite";
import { describe, expect, test } from "vitest";
import { getCirroOptions } from "../src/runtime/setup.ts";
import { type CirroOptions, cirro } from "../src/vite/vite.ts";

// Plugin のフックは object 形式・関数形式のどちらでも書けるため、関数として呼び出す薄い橋。
// biome-ignore lint/suspicious/noExplicitAny: Vite のフック型は this とオーバーロードを持つため落とす
function callHook<K extends keyof Plugin>(plugin: Plugin, name: K, ...args: any[]): any {
    const hook = plugin[name];
    const fn = typeof hook === "function" ? hook : (hook as { handler: unknown }).handler;
    // biome-ignore lint/suspicious/noExplicitAny: 同上
    return (fn as (...a: any[]) => any).call({}, ...args);
}

function plugin(options: CirroOptions = { routes: "./src/routes.ts" }): Plugin {
    return cirro(options);
}

describe("cirro(): build config injection", () => {
    // ここで注入する設定が、Vite 由来のインライン（モジュールプリローダの polyfill・
    // 小さなアセットの data URI 化）を封じている（01_CHARTER.md / 04_USAGE.md 3.3）。
    // csp.test.ts は「結果としてインラインが無い」ことを守るが、その根拠はここで名指しする。
    const config = () => callHook(plugin(), "config");

    test("disables the module preload polyfill (it would be an inline script)", () => {
        expect(config().build.modulePreload).toEqual({ polyfill: false });
    });

    test("sets assetsInlineLimit to 0 (no data: URI inlining)", () => {
        expect(config().build.assetsInlineLimit).toBe(0);
    });

    test("enables the manifest (the runtime resolves the client entry through it)", () => {
        expect(config().build.manifest).toBe(true);
    });

    test("declares the island mounter virtual module as the single client input", () => {
        expect(config().build.rollupOptions.input).toEqual({ client: "virtual:cirro/client" });
    });
});

describe("cirro(): the island mounter virtual module", () => {
    const VIRTUAL = "virtual:cirro/client";
    const RESOLVED = `\0${VIRTUAL}`;

    test("resolves the virtual id and leaves other ids alone", () => {
        const p = plugin();
        expect(callHook(p, "resolveId", VIRTUAL)).toBe(RESOLVED);
        expect(callHook(p, "resolveId", "./src/main.tsx")).toBeUndefined();
    });

    test("loads nothing for ids other than the resolved virtual id", () => {
        expect(callHook(plugin(), "load", "./src/main.tsx")).toBeUndefined();
    });

    test("emits an empty module when the islands option is unset", () => {
        const p = plugin({ routes: "./src/routes.ts" });
        callHook(p, "configResolved", { root: "/app" });
        expect(callHook(p, "load", RESOLVED)).toBe("");
    });

    test("emits a mounter that imports the islands registry resolved against the vite root", () => {
        const p = plugin({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" });
        callHook(p, "configResolved", { root: "/app" });
        const code: string = callHook(p, "load", RESOLVED);
        expect(code).toContain(`import islands from ${JSON.stringify(resolve("/app", "./src/islands/registry.ts"))};`);
    });

    test("emits a mounter that hydrates every data-island element from data-props", () => {
        const p = plugin({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" });
        callHook(p, "configResolved", { root: "/app" });
        const code: string = callHook(p, "load", RESOLVED);
        expect(code).toContain('document.querySelectorAll("[data-island]")');
        expect(code).toContain("JSON.parse(el.dataset.props)");
        expect(code).toContain("hydrateRoot(el, createElement(islands[name], props))");
    });

    test("emits no inline-executable string beyond module imports (client code stays external)", () => {
        const p = plugin({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" });
        callHook(p, "configResolved", { root: "/app" });
        const code: string = callHook(p, "load", RESOLVED);
        // 仮想モジュールは外部ファイルとしてバンドルされる。eval / new Function 等の
        // 動的評価をここへ持ち込むと script-src 'self' が崩れるため、混入を禁じる。
        expect(code).not.toMatch(/\beval\b|new Function|document\.write|innerHTML/);
    });
});

describe("getCirroOptions", () => {
    test("finds the options published by the cirro plugin", () => {
        const options: CirroOptions = { routes: "./src/routes.ts", islands: "./src/islands/registry.ts" };
        // biome-ignore lint/suspicious/noExplicitAny: ResolvedConfig の最小形だけを渡す
        const resolved = { plugins: [{ name: "vite:react" }, cirro(options)] } as any;
        expect(getCirroOptions(resolved)).toBe(options);
    });

    test("throws when the cirro plugin is missing from the config", () => {
        // biome-ignore lint/suspicious/noExplicitAny: 同上
        expect(() => getCirroOptions({ plugins: [{ name: "vite:react" }] } as any)).toThrow(/plugin not found in Vite config/);
    });

    test("ignores a plugin named cirro that does not publish options", () => {
        // biome-ignore lint/suspicious/noExplicitAny: 同上
        expect(() => getCirroOptions({ plugins: [{ name: "cirro" }] } as any)).toThrow(/plugin not found in Vite config/);
    });
});
