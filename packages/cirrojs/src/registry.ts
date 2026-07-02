import { AsyncLocalStorage } from "node:async_hooks";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Properties } from "./properties";

export type Registry = Map<string, [string[], Partial<Properties>]>;

// レンダリング 1 回分の収集状態。css() の登録先（registry）と、styleSample() が積んだ
// サンプル要素のキュー（samples）を持つ。
type Store = {
    registry: Registry;
    samples: ReactNode[];
};

// レンダリング 1 回ごとに専用のストアを割り当て、AsyncLocalStorage で暗黙に引き継ぐ。
// モジュールグローバルな可変 Map を共有しないため、レンダリングがインターリーブしても
// 別ルートの css() が混ざらない（順序依存・初期化忘れの不具合を構造的に排除する）。
// 注意: AsyncLocalStorage はスレッドを跨がないため、将来 worker_threads で並列化する場合は
// ワーカー単位で結果を集約する設計にすること。
const als = new AsyncLocalStorage<Store>();

export function registerCss(designator: string, selectors: string[], properties: Partial<Properties>) {
    const store = als.getStore();
    if (!store) throw new Error("cirro: css() was called outside of a render context");
    store.registry.set(designator, [selectors, properties]);
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

// 1 レンダリングで処理するサンプル数の上限。コンポーネントが自分自身を（直接・間接に）
// styleSample() するとキューは尽きず無限ループになるため、黙って回り続けず原因を示して失敗させる保険。
const MAX_STYLE_SAMPLES = 1000;

// fn（通常は renderToStaticMarkup によるレンダリング）を専用レジストリのコンテキストで実行し、
// その戻り値と、レンダリング中に css() が登録したレジストリを返す。
// fn の完了後、styleSample() が積んだサンプル要素を同じコンテキストで順に描画する。
// 出力 HTML は捨て、描画過程で実行された css() の登録だけを収集へ反映する。
// サンプルの描画がさらに styleSample() を呼んだ場合も、同じキューへ積まれて続けて処理される。
export function runWithRegistry<T>(fn: () => T): { result: T; registry: Registry } {
    const store: Store = { registry: new Map(), samples: [] };
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
    return { result, registry: store.registry };
}

export type RunWithRegistry<T> = (fn: () => T) => { result: T; registry: Registry };
