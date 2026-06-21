import type { Properties } from "./properties";

// registry.ts のブラウザ向け差し替え版（package.json の exports "browser" 条件で解決される）。
// クライアントでは css() の戻り値（designator = クラス名）だけが必要で、CSS 本体はビルド時に
// 静的生成済みのため登録は不要。node:async_hooks を一切 import しないことで、クライアント
// バンドルへの async_hooks 混入とブラウザ実行時エラーを構造的に排除する。
export type Registry = Map<string, [string[], Partial<Properties>]>;

// クライアントでは no-op。SSR 側（registry.ts）と同一シグネチャを保つこと。
export function registerCss(_designator: string, _selectors: string[], _properties: Partial<Properties>): void {}

// レンダリングコンテキストの確立はサーバー専用。クライアントから呼ばれた場合は実装ミスなので明示的に失敗させる。
export function runWithRegistry<T>(_fn: () => T): { result: T; registry: Registry } {
    throw new Error("cirro: runWithRegistry is server-only and must not be called on the client");
}

export type RunWithRegistry<T> = (fn: () => T) => { result: T; registry: Registry };
