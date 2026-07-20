import { AsyncLocalStorage } from "node:async_hooks";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { FaIcon } from "../lib/fontawesome.ts";
import { allowed_icon_names } from "../lib/fontawesome.ts";
import type { Site } from "../lib/site.ts";
import { createRegistry, type ErrorInfo, type Registry, type RenderContext, type RuleNode } from "./registry.common.ts";

// 型は registry.common.ts に集約したが、公開 API としての所在（cirrojs/registry）は維持する。
// registry.browser.ts と同一の型を再 export すること。
export type {
    AtBlockRule,
    AtStatementRule,
    BrokenImageSrc,
    BrokenLink,
    Declarations,
    MissingSite,
    Registry,
    RenderContext,
    RuleNode,
    RunWithRegistry,
    StyleRule,
} from "./registry.common";

// レンダリング 1 回分の収集状態。css() の登録先（registry）と、styleSample() が積んだ
// サンプル要素のキュー（samples）を持つ。
type Store = {
    registry: Registry;
    globalRuleDesignators: Set<string>;
    samples: ReactNode[];
    links?: Set<string>;
    errors: ErrorInfo[];
    renderContext?: RenderContext;
};

// レンダリング 1 回ごとに専用のストアを割り当て、AsyncLocalStorage で暗黙に引き継ぐ。
// モジュールグローバルな可変 Map を共有しないため、レンダリングがインターリーブしても
// 別ルートの css() が混ざらない（順序依存・初期化忘れの不具合を構造的に排除する）。
// 注意: AsyncLocalStorage はスレッドを跨がないため、将来 worker_threads で並列化する場合は
// ワーカー単位で結果を集約する設計にすること。
const als = new AsyncLocalStorage<Store>();

export function registerRules(key: string, nodes: RuleNode[]) {
    const store = als.getStore();
    if (!store) throw new Error("cirro: css() was called outside of a render context");
    store.registry.style.set(key, nodes);
}

export function registerGlobalRuleDesignator(key: string) {
    const store = als.getStore();
    if (!store) throw new Error("cirro: css() was called outside of a render context");
    store.globalRuleDesignators.add(key);
}

// styleSample() のサンプル要素をキューへ積む。ここでは描画しない。
// レンダリング中（コンポーネント本体）にネストした renderToStaticMarkup() を実行すると、
// react-dom/server のフック内部状態がリセットされ、呼び出し元でその後に呼ぶフックが
// "Invalid hook call" で失敗する（実測）。そのため描画は本描画の完了後まで遅延する。
export function registerStyleSample(element: ReactNode) {
    const store = als.getStore();
    if (!store) throw new Error("cirro: styleSample() was called outside of a render context");
    store.samples.push(element);
}

// リンクの分類（09_LINK_SAFETY.md 4.2）。違反なら種別を、問題なければ null を返す。
// checkLink（JSX の <Link>）と checkMarkdownRef（Markdown 本文）で共有する。
function classifyLink(link: string, links: Set<string> | undefined): "not-found" | "malformed" | null {
    try {
        const decodedLink = decodeURIComponent(link);

        if (decodedLink.startsWith("//") || decodedLink.startsWith("/\\")) {
            return "malformed";
        }
        if (!decodedLink.startsWith("/") && !decodedLink.startsWith("#")) {
            return "malformed";
        }
        if (decodedLink.startsWith("#")) {
            return null;
        }

        const normalizedLink = decodedLink.replace(/#.*$/, "").replace(/\?.*$/, "");
        if (links && !links.has(normalizedLink)) {
            return "not-found";
        }
        return null;
    } catch (e) {
        if (e instanceof URIError) {
            return "malformed";
        }
        throw e;
    }
}

export function checkLink(link: string) {
    const store = als.getStore();
    if (!store) throw new Error("cirro: checkLink() was called outside of a render context");

    const type = classifyLink(link, store.links);
    if (type !== null) {
        store.errors.push({ cause: "broken-link", type, link });
    }
}

// Markdown 本文中の参照（a href / img src）の検証（13_MARKDOWN_REF_CHECK.md 4.1）。
// checkLink と違い、レンダリングコンテキスト外（loader 内での事前レンダリング等）では
// throw せず検証をスキップする（同 4.5。検証はページ描画時に行われる）。
// スキーム付き URL（外部リンク・外部画像）のスキップは呼び出し側（markdown パイプライン）が行う。
export function checkMarkdownRef(attr: "href" | "src", ref: string): void {
    const store = als.getStore();
    if (!store) return;

    const type = classifyLink(ref, store.links);
    if (type !== null) {
        store.errors.push({ cause: "markdown-ref", attr, type, ref });
    }
}

export function checkImage(from: string): string | null {
    const store = als.getStore();
    if (!store) throw new Error("cirro: checkImage() was called outside of a render context");

    try {
        const decodedFrom = decodeURIComponent(from);
        const normalizedFrom = decodedFrom.replace(/#.*$/, "").replace(/\?.*$/, "");

        if (decodedFrom.startsWith("/")) {
            if (store.links && !store.links.has(normalizedFrom)) {
                store.errors.push({ cause: "broken-image-src", type: "not-found", from });
                return null;
            }
            return from;
        }

        if (decodedFrom.startsWith(":")) {
            store.errors.push({ cause: "broken-image-src", type: "unsupported", from });
            return null;
        }

        if (/^(@[a-z0-9~][\w.~-]*\/)?[a-z0-9~][\w.~-]*:\/(?!\/)/.test(decodedFrom)) {
            store.errors.push({ cause: "broken-image-src", type: "unsupported", from });
            return null;
        }

        store.errors.push({ cause: "broken-image-src", type: "malformed", from });
        return null;
    } catch (e) {
        if (e instanceof URIError) {
            store.errors.push({ cause: "broken-image-src", type: "malformed", from });
            return null;
        } else {
            throw e;
        }
    }
}

// site を要求する機能の共通入口（12_SITE_METADATA.md 4.7）。site が未宣言なら violation を
// 収集して null を返す（throw しない。dev は警告・build はまとめて報告して非ゼロ終了）。
export function requireSite(feature: string): Site | null {
    const store = als.getStore();
    if (!store) throw new Error(`cirro: ${feature} was called outside of a render context`);
    if (!store.renderContext?.site) {
        store.errors.push({ cause: "missing-site", feature });
        return null;
    }
    return store.renderContext.site;
}

// site 由来の設定が解決できない違反（channel description 欠落等）を同じレールへ積む。
export function reportMissingSiteConfig(feature: string): void {
    const store = als.getStore();
    if (!store) throw new Error(`cirro: ${feature} was called outside of a render context`);
    store.errors.push({ cause: "missing-site", feature });
}

// 現在レンダリング中ページのクリーン URL 正規形（ランタイムが渡す）。
export function currentPagePath(): string | undefined {
    const store = als.getStore();
    if (!store) throw new Error("cirro: currentPagePath() was called outside of a render context");
    return store.renderContext?.pagePath;
}

// 全 html ページのクリーン URL 一覧（sitemap 生成用。ランタイムが渡す）。
export function htmlPagePaths(): string[] {
    const store = als.getStore();
    if (!store) throw new Error("cirro: htmlPagePaths() was called outside of a render context");
    return store.renderContext?.htmlPaths ?? [];
}

// ルート相対 path を origin で絶対 URL 化する。path は Link と同じ検証レールに乗るため、
// 存在しないパスの絶対 URL 化はビルドで検出される（12_SITE_METADATA.md 4.3）。
export function absoluteUrl(path: string): string {
    const store = als.getStore();
    if (!store) throw new Error("cirro: absoluteUrl() was called outside of a render context");
    checkLink(path);
    if (!store.renderContext?.site?.origin) {
        store.errors.push({ cause: "missing-site", feature: "absoluteUrl()" });
        return path;
    }
    return store.renderContext.site.origin + path;
}

// 現在レンダリング中ページの絶対 URL（クリーン形）を返す。
export function pageUrl(): string {
    const store = als.getStore();
    if (!store) throw new Error("cirro: pageUrl() was called outside of a render context");
    const path = store.renderContext?.pagePath ?? "";
    if (!store.renderContext?.site?.origin) {
        store.errors.push({ cause: "missing-site", feature: "pageUrl()" });
        return path;
    }
    return store.renderContext.site.origin + path;
}

// <Island> の描画を照合する（14_CONFIG_VALIDATION.md 4.3・4.4）。
// - islands オプション未設定なら not-configured（マウンタが空でハイドレーションが走らない）
// - 設定されたレジストリのキーに無い名前なら unknown-name（マウンタが黙ってスキップする）
// - props が JSON ラウンドトリップで同値に戻らない値を含むなら island-props
// いずれも throw せず errors へ収集する（dev は警告・build はまとめて報告して非ゼロ終了）。
export function registerIslandUsage(name: string, props: unknown): void {
    const store = als.getStore();
    if (!store) throw new Error("cirro: <Island> was rendered outside of a render context");

    const islandNames = store.renderContext?.islandNames;
    if (islandNames === undefined) {
        store.errors.push({ cause: "island", type: "not-configured", island: name });
    } else if (!islandNames.has(name)) {
        store.errors.push({ cause: "island", type: "unknown-name", island: name });
    }

    const issues: PropIssue[] = [];
    findNonSerializable(props, "props", issues, new Set());
    for (const issue of issues) {
        store.errors.push({ cause: "island-props", island: name, path: issue.path, kind: issue.kind });
    }
}

type PropIssue = { path: string; kind: string };

// 判定基準は「JSON ラウンドトリップで同値に戻るか」。JSON.stringify が黙って落とす値
// （function / symbol / undefined）、落とせない値（bigint / 循環参照）、型が変わる値
// （非有限数 → null、prototype が素の Object / Array でないオブジェクト: Date / Map /
// React 要素等）をすべて違反として列挙する。
function findNonSerializable(value: unknown, path: string, issues: PropIssue[], seen: Set<object>): void {
    switch (typeof value) {
        case "function":
        case "symbol":
        case "bigint":
        case "undefined":
            issues.push({ path, kind: typeof value });
            return;
        case "number":
            if (!Number.isFinite(value)) issues.push({ path, kind: "non-finite number" });
            return;
        case "object":
            break;
        default:
            return; // string / boolean
    }
    if (value === null) return;
    // seen は祖先集合。真の循環だけを検出する（同一オブジェクトを複数 prop で共有する DAG は
    // JSON では複製されるだけなので違反にしない）。
    if (seen.has(value)) {
        issues.push({ path, kind: "circular reference" });
        return;
    }
    seen.add(value);

    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            findNonSerializable(value[i], `${path}[${i}]`, issues, seen);
        }
        seen.delete(value);
        return;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
        issues.push({ path, kind: `non-plain object (${value.constructor?.name ?? "unknown"})` });
        seen.delete(value);
        return;
    }
    for (const [k, v] of Object.entries(value)) {
        findNonSerializable(v, `${path}.${k}`, issues, seen);
    }
    seen.delete(value);
}

export function registerIcon(icon: FaIcon) {
    const store = als.getStore();
    if (!store) throw new Error("cirro: registerIcon() was called outside of a render context");

    const iconId = `${icon.type}/${icon.name}`;
    const icons = allowed_icon_names[icon.type];
    if (icons === undefined) {
        store.errors.push({ cause: "broken-image-src", type: "not-exist", from: iconId });
        return;
    }

    if (!icons.has(icon.name)) {
        store.errors.push({ cause: "broken-image-src", type: "not-exist", from: iconId });
        return;
    }

    store.registry.icon.add(`${icon.type}/${icon.name}`);
}

// 1 レンダリングで処理するサンプル数の上限。コンポーネントが自分自身を（直接・間接に）
// styleSample() するとキューは尽きず無限ループになるため、黙って回り続けず原因を示して失敗させる保険。
const MAX_STYLE_SAMPLES = 1000;

// fn（通常は renderToStaticMarkup によるレンダリング）を専用レジストリのコンテキストで実行し、
// その戻り値と、レンダリング中に css() が登録したレジストリを返す。
// fn の完了後、styleSample() が積んだサンプル要素を同じコンテキストで順に描画する。
// 出力 HTML は捨て、描画過程で実行された css() の登録だけを収集へ反映する。
// サンプルの描画がさらに styleSample() を呼んだ場合も、同じキューへ積まれて続けて処理される。
export function runWithRegistry<T>(
    fn: () => T,
    init?: Registry,
    links?: Set<string>,
    renderContext?: RenderContext,
): {
    result: T;
    registry: Registry;
    globalRuleDesignators: Set<string>;
    errors: ErrorInfo[];
} {
    const store: Store = {
        registry: init ?? createRegistry(),
        globalRuleDesignators: new Set(),
        samples: [],
        links,
        errors: [],
        renderContext,
    };
    const result = als.run(store, fn);
    als.run(store, () => {
        let processed = 0;
        while (store.samples.length > 0) {
            if (++processed > MAX_STYLE_SAMPLES) {
                throw new Error(
                    `cirro: styleSample() processed more than ${MAX_STYLE_SAMPLES} elements in one render. ` +
                        "A sampled component that calls styleSample() on itself (directly or indirectly) never terminates.",
                );
            }
            renderToStaticMarkup(store.samples.shift());
        }
    });
    return {
        result,
        registry: store.registry,
        globalRuleDesignators: store.globalRuleDesignators,
        errors: store.errors,
    };
}
