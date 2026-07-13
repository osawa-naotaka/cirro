import type { ReactNode } from "react";
import type { BrokenImageSrc, BrokenLink, Registry, RuleNode } from "./registry.common";

// 型は registry.common.ts に集約したが、公開 API としての所在（cirrojs/registry）は維持する。
// registry.ts と同一の型を再 export すること。
export type {
    AtBlockRule,
    AtStatementRule,
    BrokenImageSrc,
    BrokenLink,
    Declarations,
    Registry,
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

// レンダリングコンテキストの確立はサーバー専用。クライアントから呼ばれた場合は実装ミスなので明示的に失敗させる。
export function runWithRegistry<T>(_fn: () => T): {
    result: T;
    registry: Registry;
    globalRuleSet: Set<string>;
    brokenLinks: BrokenLink[];
    brokenImageSrc: BrokenImageSrc[];
} {
    throw new Error("cirro: runWithRegistry is server-only and must not be called on the client");
}
