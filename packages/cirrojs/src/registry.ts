import { AsyncLocalStorage } from "node:async_hooks";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Properties } from "./properties";

export type Declarations = Partial<Properties>;

// 生成 CSS を表す小さな AST。css() / cssRules() / cssKeyframes() が登録時に構築し、
// stringifyCss() が再帰的に文字列化する。
// - StyleRule: セレクタ 1 個と宣言ブロック。selector は登録時点で $（自クラス参照）解決済み。
// - AtBlockRule: @layer / @media / @keyframes など任意のブロックアットルール。入れ子可。
// - AtStatementRule: "@layer a, b" のようなブロックを持たない文アットルール。
//   トップレベル専用で、出力時はプリアンブル直後に登録順で並ぶ（末尾の ; は出力時に付与）。
export type StyleRule = {
    type: "style";
    selector: string;
    declarations: Declarations;
};

export type AtBlockRule = {
    type: "at-block";
    prelude: string;
    children: RuleNode[];
};

export type AtStatementRule = {
    type: "at-statement";
    statement: string;
};

export type RuleNode = StyleRule | AtBlockRule | AtStatementRule;

// キーは designator（クラス名 / @keyframes 名 / 文のハッシュ）。同一キーの再登録は
// 上書きになるため、決定的ハッシュにより同一スタイルの重複出力が自然に排除される。
export type Registry = Map<string, RuleNode[]>;

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

export function registerRules(key: string, nodes: RuleNode[]) {
    const store = als.getStore();
    if (!store) throw new Error("cirro: css() was called outside of a render context");
    store.registry.set(key, nodes);
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
