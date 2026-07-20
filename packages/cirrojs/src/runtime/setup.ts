import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createElement, Fragment, type ReactElement } from "react";
import { createServerModuleRunner, type ResolvedConfig, type ViteDevServer } from "vite";
import type { ContentHandler } from "../lib/content.ts";
import type { AnyRoute } from "../lib/route.ts";
import type { Site } from "../lib/site.ts";
import type { RunWithRegistry } from "../registry/registry.common.ts";
import type { CirroOptions } from "../vite/vite.ts";

// routes モジュール（ユーザーの routes 定義ファイル）を Module Runner で評価した結果。
export type CirroRoutesModule = {
    runWithRegistry: RunWithRegistry<string>;
    contentHandler?: ContentHandler<unknown>;
    site?: Site;
    routes: AnyRoute<unknown>[];
};

export type setupCirroResult = {
    loadRoutesModule: () => Promise<CirroRoutesModule>;
    // 島レジストリのキー集合（islands オプション未設定なら undefined を解決する）
    loadIslandNames: () => Promise<Set<string> | undefined>;
    outDir: string;
    islandsDir?: string;
    watchDir: string;
    cssUrl: string;
};

// config 由来の静的情報を解決し、routes モジュールのローダーを返す。
// routes の評価は loadRoutesModule に遅延させる。dev サーバーはファイル変更時にモジュールグラフを
// 無効化するため、リクエストごとに loadRoutesModule を呼び直すことで最新の routes を得る
// （起動時に一度だけ評価すると、full-reload 後も古いページを描画し続けてしまう）。
// Module Runner は評価結果をキャッシュするので、無効化されていなければ再評価は起きない。
export function setupCirro(server: ViteDevServer): setupCirroResult {
    const runner = createServerModuleRunner(server.environments.ssr);
    const config = server.config;
    const options = getCirroOptions(config);
    const root = config.root;
    const outDir = resolve(root, config.build.outDir);
    const cssUrl = options.cssUrl ?? "/assets/styles.css";
    const routesPath = resolve(root, options.routes);
    const islandsPath = options.islands && resolve(root, options.islands);
    const islandsDir = islandsPath && dirname(islandsPath).replaceAll("\\", "/");
    const watchDir = resolve(root, options.watchDir ?? "./src")
        .replaceAll("\\", "/")
        .replace(/\/+$/, "");

    // 設定そのものの誤り（コンテンツに依存しない）は fail-loud（14_CONFIG_VALIDATION.md 4.1）。
    validateCssUrl(cssUrl);
    if (!existsSync(routesPath)) {
        throw new Error(`cirro: routes file not found: "${options.routes}" (resolved to ${routesPath})`);
    }
    if (islandsPath && !existsSync(islandsPath)) {
        throw new Error(`cirro: islands registry file not found: "${options.islands}" (resolved to ${islandsPath})`);
    }
    // watchDir の不存在は HMR が効かないだけで動作は正しいため、エラーには格上げしない。
    if (!existsSync(watchDir)) {
        console.warn(`cirro: watchDir "${options.watchDir ?? "./src"}" does not exist (resolved to ${watchDir}); file watching will not fire.`);
    }

    // 島レジストリのキー集合を返す（islands オプション未設定なら undefined）。
    // ここで default export の形状も検証する。dev ではブラウザコンソールにしか出なかった
    // export 忘れ（14_CONFIG_VALIDATION.md S8）も、この import で確実に検出される。
    const loadIslandNames = async (): Promise<Set<string> | undefined> => {
        if (!islandsPath) return undefined;
        const obj = await runner.import(islandsPath);
        if (typeof obj.default !== "object" || obj.default === null || Array.isArray(obj.default)) {
            throw new Error(`cirro: islands registry must export the island map as default (export default { name: Component } as const): ${islandsPath}`);
        }
        return new Set(Object.keys(obj.default));
    };

    const loadRoutesModule = async (): Promise<CirroRoutesModule> => {
        const obj = await runner.import(routesPath);
        if (typeof obj.runWithRegistry !== "function") throw new Error("cirro: you must export runWithRegistry.");
        if (typeof obj.default !== "object") throw new Error("cirro: you must export routes.");
        if (!Array.isArray(obj.default.routes)) throw new Error("cirro: you must define routes and export it as `default`");
        if (obj.default.content && typeof obj.default.content.loader !== "function") throw new Error("you must define a valid content loader function");
        if (obj.default.site && (typeof obj.default.site.origin !== "string" || typeof obj.default.site.title !== "string")) {
            throw new Error("cirro: site must be created with defineSite() and passed to createRouteFn({ site })");
        }

        return {
            runWithRegistry: obj.runWithRegistry,
            contentHandler: obj.default.content,
            site: obj.default.site,
            routes: obj.default.routes,
        };
    };

    return {
        loadRoutesModule,
        loadIslandNames,
        outDir,
        islandsDir,
        watchDir,
        cssUrl,
    };
}

// cssUrl の形式検証。`/` 始まりでないと相対 URL として出力され、下層ページでだけ CSS が
// 404 になる silent failure になる（14_CONFIG_VALIDATION.md S6）。
export function validateCssUrl(cssUrl: string): void {
    if (!cssUrl.startsWith("/") || cssUrl.startsWith("//") || cssUrl.includes("..") || cssUrl.includes("\\")) {
        throw new Error(`cirro: cssUrl must be a root-relative path like "/assets/styles.css": "${cssUrl}"`);
    }
}

// 解決済み Vite config から cirro プラグインのオプションを取り出す。
// cirro() プラグインが `api: { options }` で公開している。
export function getCirroOptions(config: ResolvedConfig): CirroOptions {
    for (const p of config.plugins) {
        const api = p.api as { options?: CirroOptions } | undefined;
        if (p.name === "cirro" && api?.options) return api.options;
    }
    throw new Error("cirro: plugin not found in Vite config (did you add cirro() to plugins?)");
}

// クライアントスクリプトをツリーに併置して返す。
// <head> を自前で探索する代わりに、React 19 のメタデータ巻き上げ（hoisting）を利用する。
// `<script async>` はツリーのどこに置いても React が <head> へ自動で巻き上げるため、
// ページが <html>/<head> を子コンポーネント（Layout 等）の奥に隠していても確実に <head> へ入る。
// 文字列置換は行わず、インラインスクリプトも生成しないため CSP 厳格性（script-src 'self'）を維持する。
//
// 注意:
// - `<script>` の巻き上げを発火させるには `async` が必須。これにより module の実行は「文書順（defer）」から
//   「取得次第即実行（async）」に変わるが、島マウンタのエントリは 1 本なので順序問題は生じない。
// - `<link rel="stylesheet">` の巻き上げには `precedence` が必須。これを付けて初めて React は link を
//   単なる要素ではなく「スタイルシートリソース」として扱い、<head> へ巻き上げ・重複排除・順序管理する。
//   `precedence` が無いと link はツリー上の位置（= <body> 内）にそのまま残り、スタイル未適用の HTML が
//   一瞬表示される（FOUC）。出力には data-precedence 属性が残るが、無害なデータ属性で CSP にも影響しない。
// - 挿入位置は <head> の先頭（既存の <title> 等より前）になる。外部リソースのため実害はない。
export function appendClientScriptAndCss(root: ReactElement, jsSrc: string, cssSrc: string): ReactElement {
    const script = createElement("script", { async: true, type: "module", src: jsSrc, key: "cirro-client" });
    const css = createElement("link", { rel: "stylesheet", href: cssSrc, precedence: "default", key: "cirro-css" });
    return createElement(Fragment, null, root, script, css);
}
