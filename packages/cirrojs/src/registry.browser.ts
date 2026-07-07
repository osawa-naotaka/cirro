import type { ReactNode } from "react";
import type { BrokenLink, Registry, RuleNode } from "./registry.common";

// クライアントでは no-op。SSR 側（registry.ts）と同一シグネチャを保つこと。
export function registerRules(_key: string, _nodes: RuleNode[]): void {}

export function registerGlobalRuleSet(_key: string): void {}

// クライアントでは no-op。CSS は初期 SSR 描画で収集・生成済みのため、サンプルの描画は不要。
export function registerStyleSample(_element: ReactNode): void {}

export function checkLink(_link: string): void {}

// export function registerLinks(_links: string[]) {}


// レンダリングコンテキストの確立はサーバー専用。クライアントから呼ばれた場合は実装ミスなので明示的に失敗させる。
export function runWithRegistry<T>(_fn: () => T): { result: T; registry: Registry; globalRuleSet: Set<string>; brokenLinks: BrokenLink[] } {
    throw new Error("cirro: runWithRegistry is server-only and must not be called on the client");
}
