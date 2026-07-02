// registerStyleSample はランタイム値なので自己参照 import 経由で解決する。
// これにより exports の browser 条件が効き、クライアントでは async_hooks / react-dom/server に
// 依存しない no-op 実装（registry.browser.ts）に差し替わる。
import { registerStyleSample } from "cirrojs/registry";
import type { ReactNode } from "react";

// サンプル要素を登録し、初期 SSR 描画でレンダリングされない部分（条件付きマウントの子など）の
// css() を収集させる（05_STYLING.md 7.3）。
//
// - element はここでは描画されない。runWithRegistry() が本描画の完了後にレンダリングし、
//   出力 HTML は捨てて css() の登録だけを収集する。コンポーネントの直接呼び出しと違い
//   子孫コンポーネントまで実行され、フックがあっても安全（独立したレンダリングルートになる）。
// - レンダリング中（コンポーネント本体）に呼ぶこと。css() と同じ制約で、描画コンテキスト外では
//   例外を投げる。本体のどこで呼んでもよい（フックとの順序制約はない）。
// - クライアントでは no-op。CSS は静的生成済みのため、実行時の描画は不要。
export function styleSample(element: ReactNode): void {
    registerStyleSample(element);
}
