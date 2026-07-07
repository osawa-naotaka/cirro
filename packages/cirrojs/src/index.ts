// cirro 公開 API（クライアント安全なもののみ）
// サーバー専用 API（createIsland / createMarkdown）は重い依存（react-dom/server, remark/prism）を
// 引き込むため、クライアントバンドルへの混入を防ぐべく "cirrojs/server" (src/server.ts) に分離した。

// runWithRegistry はランタイム値。css.ts の registerCss と同一モジュールインスタンス（=同一 als）を
// 共有させるため、こちらも自己参照 import 経由で解決する。SSR では real の registry.ts に解決される。
export { runWithRegistry } from "cirrojs/registry";
export type { ContentType, PageProps } from "./content.ts";
export { defineContent } from "./content.ts";
export type { CssFn, CssFnOpt, InjectFn, SsOpt, ToKeyframesOpt, ToStyleOpt } from "./css.ts";
export { at, atStatement, genCssFn, ss, toKeyframes, toStyle } from "./css.ts";
export { Link } from "./Link.tsx";
export type { Properties } from "./properties.ts";
export type { AtBlockRule, AtStatementRule, Registry, RuleNode, StyleRule } from "./registry.common.ts";
export type { AnyRoute, DynamicRoute, FileRoute, Params, StaticRoute } from "./route.ts";
export { createRouteFn } from "./route.ts";
export { styleSample } from "./styleSample.ts";
