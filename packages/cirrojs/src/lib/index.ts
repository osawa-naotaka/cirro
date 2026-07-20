// cirro 公開 API（クライアント安全なもののみ）
// サーバー専用 API（createIsland / createMarkdown）は重い依存（react-dom/server, remark/prism）を
// 引き込むため、クライアントバンドルへの混入を防ぐべく "cirrojs/server" (src/server.ts) に分離した。

// runWithRegistry / absoluteUrl / pageUrl はランタイム値。css.ts の registerCss と
// 同一モジュールインスタンス（=同一 als）を共有させるため、自己参照 import 経由で解決する。
// SSR では real の registry.ts に、クライアントでは registry.browser.ts に解決される。
export { absoluteUrl, pageUrl, runWithRegistry } from "cirrojs/registry";
export type { AtBlockRule, AtStatementRule, Registry, RuleNode, StyleRule } from "../registry/registry.common.ts";
export type { ContentType, PageProps } from "./content.ts";
export { defineContent } from "./content.ts";
export type { CssFn, CssFnOpt, InjectFn, SsOpt, ToKeyframesOpt, ToStyleOpt } from "./css.ts";
export { at, atStatement, genCssFn, ss, toKeyframes, toStyle } from "./css.ts";
export { FaImage, type FaImageProps } from "./FaImage.tsx";
export type { BrandsIcon, BrandsIconName, FaIcon, IconType, RegularIcon, RegularIconName, SolidIcon, SolidIconName } from "./fontawesome.ts";
export { Image, type ImageProps } from "./Image.tsx";
export { Link, type LinkProps } from "./Link.tsx";
export { Ogp, type OgpProps } from "./Ogp.tsx";
export type { Properties } from "./properties.ts";
export type { AnyRoute, CreateRouteFnOpt, DynamicRoute, FileRoute, Params, StaticRoute } from "./route.ts";
export { createRouteFn } from "./route.ts";
export { type RssItem, type RssOpt, rssXml } from "./rss.ts";
export type { Site, SiteConfig } from "./site.ts";
export { defineSite } from "./site.ts";
export { type SitemapOpt, sitemapXml } from "./sitemap.ts";
export { styleSample } from "./styleSample.ts";
