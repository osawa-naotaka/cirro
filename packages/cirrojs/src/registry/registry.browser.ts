import type { ReactNode } from "react";
import type { FaIcon } from "../lib";
import type { Site } from "../lib/site.ts";
import type { ErrorInfo, Registry, RuleNode } from "./registry.common";

// 型は registry.common.ts に集約したが、公開 API としての所在（cirrojs/registry）は維持する。
// registry.ts と同一の型を再 export すること。
export type {
    AtBlockRule,
    AtStatementRule,
    BrokenImageSrc,
    BrokenLink,
    Declarations,
    MissingSite,
    Registry,
    RenderSiteContext,
    RuleNode,
    RunWithRegistry,
    StyleRule,
} from "./registry.common";

// クライアントでは no-op。SSR 側（registry.ts）と同一シグネチャを保つこと。
export function registerRules(_key: string, _nodes: RuleNode[]): void {}

export function registerGlobalRuleDesignator(_key: string): void {}

// クライアントでは no-op。CSS は初期 SSR 描画で収集・生成済みのため、サンプルの描画は不要。
export function registerStyleSample(_element: ReactNode): void {}

export function checkLink(_link: string): void {}

export function checkImage(from: string): string | null {
    return from;
}

export function registerIcon(_icon: FaIcon): void {}

// サイトメタデータ系は SSR 専用（12_SITE_METADATA.md 5 章。島内では使わない契約）。
// no-op で誤魔化すと hydration mismatch や空 URL の silent failure になるため、明示的に失敗させる。
export function requireSite(feature: string): Site | null {
    throw new Error(`cirro: ${feature} is server-only and must not be called on the client (do not use it inside islands)`);
}

export function reportMissingSiteConfig(feature: string): void {
    throw new Error(`cirro: ${feature} is server-only and must not be called on the client (do not use it inside islands)`);
}

export function currentPagePath(): string | undefined {
    throw new Error("cirro: currentPagePath() is server-only and must not be called on the client");
}

export function htmlPagePaths(): string[] {
    throw new Error("cirro: htmlPagePaths() is server-only and must not be called on the client");
}

export function absoluteUrl(_path: string): string {
    throw new Error("cirro: absoluteUrl() is server-only and must not be called on the client (do not use it inside islands)");
}

export function pageUrl(): string {
    throw new Error("cirro: pageUrl() is server-only and must not be called on the client (do not use it inside islands)");
}

// レンダリングコンテキストの確立はサーバー専用。クライアントから呼ばれた場合は実装ミスなので明示的に失敗させる。
export function runWithRegistry<T>(_fn: () => T): {
    result: T;
    registry: Registry;
    globalRuleDesignators: Set<string>;
    errors: ErrorInfo[];
} {
    throw new Error("cirro: runWithRegistry is server-only and must not be called on the client");
}
