// cirro 公開 API（クライアント安全なもののみ）
// サーバー専用 API（createIsland / createMarkdown）は重い依存（react-dom/server, remark/prism）を
// 引き込むため、クライアントバンドルへの混入を防ぐべく "cirrojs/server" (src/server.ts) に分離した。

// runWithRegistry はランタイム値。css.ts の registerCss と同一モジュールインスタンス（=同一 als）を
// 共有させるため、こちらも自己参照 import 経由で解決する。SSR では real の registry.ts に解決される。
export { runWithRegistry } from "cirrojs/registry";
export type { CssFnT, CssKeyframesOpt, CssOpt, KeyframeFrames, NestedRules } from "./css.ts";
export { css, cssKeyframes, cssRules, genCssFn } from "./css.ts";
export type { Properties } from "./properties.ts";
export type { AtBlockRule, AtStatementRule, Declarations, Registry, RuleNode, StyleRule } from "./registry.ts";
export type { AnyRoute, DynamicRoute, FileRoute, Params, StaticRoute } from "./route.ts";
export { defineRoutes } from "./route.ts";
export { styleSample } from "./styleSample.ts";
