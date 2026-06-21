// cirro 公開 API（クライアント安全なもののみ）
// サーバー専用 API（createIsland / createMarkdown）は重い依存（react-dom/server, remark/prism）を
// 引き込むため、クライアントバンドルへの混入を防ぐべく "cirrojs/server" (src/server.ts) に分離した。

export type { CssOpt } from "./css.ts";
export { css, genCssFn } from "./css.ts";
export type { Properties } from "./properties.ts";
export type { Registry } from "./registry.ts";
// runWithRegistry はランタイム値。css.ts の registerCss と同一モジュールインスタンス（=同一 als）を
// 共有させるため、こちらも自己参照 import 経由で解決する。SSR では real の registry.ts に解決される。
export { runWithRegistry } from "cirrojs/registry";
export type { AnyRoute, DynamicRoute, FileRoute, Params, StaticRoute } from "./route.ts";
