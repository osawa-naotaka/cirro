import { AsyncLocalStorage } from "node:async_hooks";
import type { Properties } from "./properties";

export type Registry = Map<string, [string[], Partial<Properties>]>;

// レンダリング 1 回ごとに専用のレジストリを割り当て、AsyncLocalStorage で暗黙に引き継ぐ。
// モジュールグローバルな可変 Map を共有しないため、レンダリングがインターリーブしても
// 別ルートの css() が混ざらない（順序依存・初期化忘れの不具合を構造的に排除する）。
// 注意: AsyncLocalStorage はスレッドを跨がないため、将来 worker_threads で並列化する場合は
// ワーカー単位で結果を集約する設計にすること。
const als = new AsyncLocalStorage<Registry>();

export function registerCss(designator: string, selectors: string[], properties: Partial<Properties>) {
    const registry = als.getStore();
    if (!registry) throw new Error("cirro: css() was called outside of a render context");
    registry.set(designator, [selectors, properties]);
}

// fn（通常は renderToStaticMarkup によるレンダリング）を専用レジストリのコンテキストで実行し、
// その戻り値と、レンダリング中に css() が登録したレジストリを返す。
export function runWithRegistry<T>(fn: () => T): { result: T; registry: Registry } {
    const registry: Registry = new Map();
    const result = als.run(registry, fn);
    return { result, registry };
}

export type RunWithRegistry<T> = (fn: () => T) => { result: T; registry: Registry };
