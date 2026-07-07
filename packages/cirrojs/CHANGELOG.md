# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

- Added: for new features.
- Changed: for changes in existing functionality.
- Deprecated: for soon-to-be removed features.
- Removed: for now removed features.
- Fixed: for any bug fixes.
- Security: in case of vulnerabilities.

## [Unreleased]

## [0.0.27] - 2026-07-07

### Added
- `Link` component and `LinkProps` type, exported from the package entry point. `Link` renders an `<a>` element whose `href` is the `to` prop as written, and passes through every other standard anchor attribute (`href` itself is excluded from the props type, so `to` is the only way to set the destination). During server rendering the component validates `to` against the set of site-internal URLs; in the client (island) bundle the check resolves to a no-op.
- Build-time validation of internal links written with `<Link>`. `to` must be a root-relative path (starting with `/`) or an in-page anchor (starting with `#`); values starting with `//` or `/\` (protocol-relative URLs), relative paths, external URLs, and invalid percent-encoding are reported as malformed. Links are percent-decoded before matching, and query strings and fragments are ignored. A link target is valid when it matches an accepted spelling of a route URL (the exact `.html` / `.htm` path, the clean URL without the extension, and, for directory indexes, the directory path with and without the trailing slash) or a file under Vite's `publicDir`. The dev server logs broken links to the console when rendering a page; `cirro build` reports all broken links together with the page they appear on after generating all pages, and exits with a non-zero code when any are found.
- `BrokenLink` type, exported from `cirrojs/registry`. It describes one invalid link collected during a render: `{ type: "not-found" | "malformed"; link: string }`.
- `checkLink(link)`, exported from `cirrojs/registry`. It is the validation entry called by `<Link>` during server rendering: it validates the link against the URL set of the current render context and collects violations into the render result's `brokenLinks`. The browser build resolves it to a no-op.

### Changed
- `runWithRegistry` accepts an optional third argument, `links?: Set<string>`, the set of valid site-internal URLs used to validate `<Link>` targets, and its result gains `brokenLinks: BrokenLink[]` (`{ type: "not-found" | "malformed"; link: string }`) listing the invalid links collected during the render. When `links` is omitted, existence checks are skipped; malformed values are still collected. The `RunWithRegistry` type includes the new parameter and result field.
- `ContentType<H>` resolves to `undefined` instead of `never` when `H` is not a content handle.

## [0.0.26] - 2026-07-06

### Added
- `defineContent({ loader })`, exported from the package entry point. It wraps an async `loader` function into a content handle. The runtime awaits the loader once before rendering and distributes the result to `getStaticPaths` and to every route component as the `content` prop. `cirro build` runs the loader once before static generation. The dev server runs it on the first request and caches the resulting promise; a change, addition, or deletion of a file under `watchDir` discards the cache, so the next request reloads the content.
- `createRouteFn(content?)`, exported from the package entry point. It returns `defineRoutes` and `route` helpers bound to the content handle's data type, so `getStaticPaths` and the component of every route are type-checked against the loader's return type. `route` is an identity helper that preserves the params type `P` of dynamic routes. When `createRouteFn` is called without a handle, the content type is `undefined`.
- `ContentType<H>` type, exported from the package entry point. It extracts the loaded data type from a content handle (`typeof content`).
- `PageProps<H, P>` type, exported from the package entry point. It is the props contract of a page component: `{ params: P; content: ContentType<H> }`, with `P` defaulting to `Record<string, never>`.
- The dev server now reacts to file additions and deletions (`add` / `unlink`) with the same module invalidation, content-cache discard, and full-reload as file changes, so contents read with `import.meta.glob` reflect added and removed files without a restart.

### Changed
- **Breaking**: `defineRoutes` is no longer exported from the package entry point; it is obtained from `createRouteFn()`. Its return value changed from an `AnyRoute[]` array to an object `{ content?, routes }`, so the shape of the routes module's default export changes accordingly. The dev server and `cirro build` read both the routes and the content loader from this object.
- **Breaking**: the `StaticRoute`, `DynamicRoute`, `FileRoute`, and `AnyRoute` types now take the content data type as a type parameter (`StaticRoute<T>`, `DynamicRoute<T, P>`, `FileRoute<T>`, `AnyRoute<T>`). Route components receive a `content` prop alongside `params`, and `DynamicRoute.getStaticPaths` receives the loaded content as its argument. Components and `getStaticPaths` callbacks that do not use content can keep their previous signatures.

## [0.0.25] - 2026-07-04

### Added
- `toKeyframes(frames, opt?)`, exported from the package entry point. It registers a `@keyframes` block built from style rule nodes and returns the animation name, a deterministic hash of the frame contents with the default prefix `cirro-kf`, so identical frame definitions share one name and are deduplicated in the registry. Frame selectors must be `from`, `to`, `<number>%`, or a comma-separated list of them, and frames must not contain nested rules; both are validated at registration time. The optional `wrap` (an `InjectFn`) places the block inside outer at-rules such as `@layer`. `wrap` is not part of the hash, so registering identical frames with different wrappers emits only the last registration.
- `ToKeyframesOpt` type, exported from the package entry point.
- Registration-time validation in `toStyle()`. Selectors containing `$=` (the attribute suffix matcher) are rejected because every `$` is replaced with the generated class name. Non-nested selectors containing `&` are rejected because a top-level `&` behaves as `:scope` rather than a class reference. Selectors nested inside a style rule containing `$` are rejected because the replaced class name would be subject to the implicit descendant combinator of CSS Nesting; since the default selector of `ss()` is `"$"`, nested rules now require an explicit selector. Errors are thrown at the registering call site instead of at CSS stringification.
- `defineCascadeLayer(layers?)`, exported from `cirrojs/layout`. It registers the `@layer` statement at-rule that fixes the cascade layer order. Called without arguments it declares the default order `base, font, low, main, high`.
- `resetCss()`, exported from `cirrojs/layout`. It registers a standard reset stylesheet into `@layer base`: zeroed margin, padding, and border with `box-sizing: border-box` and inherited font and color on all elements, inherited color and text-decoration on anchors, block display with `max-width: 100%` and `height: auto` on `img`, `video`, `canvas`, and `svg`, and a pointer cursor on buttons.
- A build-time consistency check for global rules. `toStyle()` records a rule as global when it contains a statement at-rule, or when its selector list (split on top-level commas, ignoring commas inside parentheses, brackets, and quoted strings) contains a selector without `$`. `cirro build` warns when a global rule is not registered on every page, naming the rule and the pages that registered it or lack it, because a page missing the rule renders differently in dev (which serves only that page's CSS) and in build (which serves the merged stylesheet).

### Changed
- **Breaking**: `cirro build` now writes a single stylesheet, `/assets/styles.css`, merged from the styles of all routes, instead of one CSS file per route. The `cssPath` field was removed from `StaticRoute` and `DynamicRoute`. The dev server serves each page's own CSS at `<page path>.css` (for example `/index.html.css`).
- **Breaking**: the generated CSS no longer starts with the fixed `@layer base, font, low, main, high;` statement. Declare the cascade layer order explicitly, for example with `defineCascadeLayer()` from `cirrojs/layout` or `toStyle(atStatement("@layer ..."))`.
- **Breaking**: the islands module named by `CirroOptions.islands` must export its island map as the default export. The generated client mounter previously imported a named `islands` export.
- `CirroOptions.islands` is now optional. When it is omitted, the client script is generated empty and the React plugin check is skipped.
- `runWithRegistry` now accepts an optional second argument, `init?: Registry`, used as the registry to collect into instead of a new empty one, and its result gains a `globalRuleSet: Set<string>` holding the designators of the global rules registered during the render. The `RunWithRegistry` type includes the new result field.

## [0.0.24] - 2026-07-03

### Added
- `ss(declarations, opt?, ...children)`, exported from the package entry point. It builds a style rule node (`StyleRule`) from type-checked CSS declarations, an optional selector (default `"$"`, the self-class reference), and optional nested child rules.
- `at(prelude, ...children)`, exported from the package entry point. It builds a block at-rule node (`AtBlockRule`) such as `@layer main` or `@media (min-width: 800px)`. At-rule nodes nest freely.
- `atStatement(statement)`, exported from the package entry point. It builds a statement at-rule node (`AtStatementRule`) such as `@layer a, b`. Statement at-rules are only allowed at the top level of the registry and are emitted right after the fixed preamble, before all other rules.
- `toStyle(node, opt?)`, exported from the package entry point. It hashes the rule node tree into a deterministic class name (default prefix `cirro`), replaces every `$` in the tree's selectors with that class, registers the tree, and returns the class name.
- `CssFn`, `CssFnOpt`, `InjectFn`, `SsOpt`, and `ToStyleOpt` types, exported from the package entry point.
- `RuleNode`, `StyleRule`, `AtBlockRule`, and `AtStatementRule` types, exported from the package entry point. They describe the CSS AST held by the registry. The `Declarations` type is exported from `cirrojs/registry`.
- Style rules can hold nested child rules (the `children` of `ss()` and `CssFn`). Nested rules are emitted as native CSS nesting: `&` is not replaced at build time and is resolved by the browser with CSS Nesting semantics, so the emitted CSS requires a CSS Nesting capable browser (evergreen browsers since 2023).
- Validation of selectors and at-rules at stringification time: at-rules must start with `@` followed by an identifier, selectors and at-rules must not contain `{`, `}`, `;`, or `/*` (block injection guard), and both are limited to 512 characters.

### Changed
- **Breaking**: `css(properties, opt?)` and the `CssOpt` type were removed from the package entry point. Styles are now built by composing rule nodes: `toStyle(ss(properties, { selector }))` replaces a plain `css()` call, and wrapping with `at()` (e.g. `toStyle(at("@layer base", ss(properties, { selector: "*" })))`) replaces the removed `atrules` option.
- **Breaking**: `genCssFn` now takes an `InjectFn` (`(injected: () => RuleNode) => RuleNode`) that wraps the generated style node in at-rules, instead of an options object (`{ atRules?, layer? }`). For example, `genCssFn({ layer: "main" })` becomes `genCssFn((inject) => at("@layer main", inject()))`. The returned function's type is `CssFn`, which replaces the removed `CssFnT` and additionally accepts nested child rules as rest arguments.
- **Breaking**: the self-reference token in selectors is now `$` instead of `&` (e.g. `selector: "$:hover"`, `selector: "$ > *"`). `$` may appear at any position (e.g. `.parent:has(> $)`) and is replaced mechanically everywhere, including inside quoted strings, so `$` cannot be written in attribute value strings for now. `&` is passed through to the output as the CSS Nesting parent reference.
- **Breaking**: the `Registry` type changed from `Map<string, [string[], Partial<Properties>]>` to `Map<string, RuleNode[]>`, a small CSS AST. The `registerCss(designator, selectors, properties)` function of `cirrojs/registry` was replaced by `registerRules(key, nodes)`.
- The `css` field of `LayoutTheme` is now typed as `CssFn` (previously `CssFnT`).
- All generated class names change because the class name hash is now computed from the rule node tree.

## [0.0.23] - 2026-07-02

### Added
- `styleSample(element)`, exported from the package entry point. It registers a sample element during server rendering. `runWithRegistry` renders the queued samples after the main render pass and discards the HTML, so `css()` calls in components that are not part of the initial SSR output (such as conditionally mounted children of islands) are still collected into the route CSS, including descendant components. On the client it is a no-op. Rendering is deferred until after the main pass because a nested `renderToStaticMarkup` inside a component body resets the hook state of react-dom/server and breaks hooks called after it.

## [0.0.22] - 2026-07-01

### Added
- New properties on the `Properties` type: `container`, `container_name`, `container_type`, `field_sizing`, `font_palette`, `font_synthesis_small_caps`, `font_synthesis_style`, `font_synthesis_weight`, `forced_color_adjust`, `hyphenate_limit_chars`, `math_depth`, `math_shift`, `math_style`, `page`, `position_area`, `position_try`, `position_try_fallbacks`, `position_try_order`, `position_visibility`, `print_color_adjust`, `reading_flow`, `reading_order`, `ruby_align`, `ruby_position`, `scroll_timeline`, `scroll_timeline_axis`, `scroll_timeline_name`, `scrollbar_gutter`, `text_autospace`, `text_box`, `text_box_edge`, `text_box_trim`, `text_spacing_trim`, `text_wrap`, `text_wrap_mode`, `text_wrap_style`, `timeline_scope`, `transition_behavior`, `view_timeline`, `view_timeline_axis`, `view_timeline_inset`, `view_timeline_name`, `view_transition_class`, `view_transition_name`, `view_transition_scope`, and `white_space_collapse`.

### Removed
- SVG-only presentation properties from the `Properties` type: `alignment_baseline`, `marker`, `marker_end`, `marker_mid`, and `marker_start`. The `Properties` type now covers styling CSS only. The `AlignmentBaselineValue` type is no longer exported.

## [0.0.21] - 2026-07-01

### Added
- `CssFnT` type, exported from the package entry point. It is the type of the CSS function returned by `genCssFn`.

## [0.0.20] - 2026-06-30

### Added
- New `row_rule`, `row_rule_color`, `row_rule_style`, and `row_rule_width` properties on the `Properties` type, for the CSS rules drawn between flex and grid rows.

### Changed
- `BorderStyleValue` now allows arbitrary strings in addition to its keyword suggestions, matching the other border value types.

## [0.0.19] - 2026-06-29

### Fixed
- `cirro build` did not support the route definition format introduced in 0.0.18. It still expected a named `routes` export and failed on sites that export their routes as the default export. The build now reads routes from the module's default export and the `runWithRegistry` named export, reporting an error when either is missing.
- The dev server now also resolves a request path to an `index.html` or `index.htm` file within the matching directory (for example `/posts` resolves to `/posts/index.html`), in addition to the existing `.html` and `.htm` resolution.

## [0.0.18] - 2026-06-29

### Added
- `defineRoutes`, exported from the package entry point. It is an identity helper that returns its route arguments as an `AnyRoute[]`, used to define a site's routes for export.

### Changed
- A route's `path` is now the full output path (for example `/index.html`, `/about.html`, `/posts/hello.html`) instead of a clean URL. The build writes each page to that path verbatim, without appending `index.html`.
- `StaticRoute` now requires a `cssPath` field naming the output path of its generated stylesheet, matching `DynamicRoute` and `FileRoute`.
- Sites must export their routes as the default export (typically the result of `defineRoutes`) instead of a named `routes` export. The dev server reads the default export and reports an error when it is missing or is not an array.

## [0.0.17] - 2026-06-29

### Added
- The CLI now sets the `CIRRO_COMMAND` environment variable during rendering: `"build"` under `cirro build` and `"dev"` under `cirro dev`. Pages can read `process.env.CIRRO_COMMAND` at render time to vary their output between development and build, for example to emit a `<meta http-equiv="Content-Security-Policy">` element only in build.

## [0.0.16] - 2026-06-29

### Changed
- The layout option types (`StackOpt`, `ClusterOpt`, `CenterOpt`, `GridOpt`, `SwitcherOpt`, `SidebarOpt`, `CoverOpt`, `FrameOpt`, `ReelOpt`, `BoxOpt`) now type their CSS-derived fields with the matching `Properties` value types instead of `string`, enabling keyword autocompletion. Affected fields: `gap`, `CenterOpt.max`/`gutters`, `SidebarOpt.sideWidth`/`contentMin`, `CoverOpt.minHeight`/`padding`, `FrameOpt.ratio`, `ReelOpt.itemWidth`/`height`, and `BoxOpt.padding`/`border`. The `GridOpt.min`, `SwitcherOpt.threshold`, and `ImposterOpt.margin` fields remain `string` as they have no single corresponding CSS property.

## [0.0.15] - 2026-06-29

### Added
- New properties on the `Properties` type: `accent_color`, `background_position_x`, `background_position_y`, `box_reflect`, `hyphenate_character`, `initial_letter`, `marker`, `marker_end`, `marker_mid`, `marker_start`, `offset_position`, and `zoom`.
- Exported helper types `Kw<T>` and `Multi<T>` used by the `Properties` value types.

### Changed
- `Properties` value types now preserve keyword autocompletion. Properties whose values mix keywords with open values (lengths, colors, etc.) keep their keyword suggestions instead of collapsing to `string`, and closed enumerations no longer accept arbitrary strings.
- `PropertyName` now resolves to the union of valid property names (previously it resolved to the array's index keys).

### Removed
- Nested-array value types (`string[][]`) from `text_shadow`, `transform_origin`, `transition_delay`, `transition_duration`, `transition_property`, `transition_timing_function`, and `mask_position`. Property values accept a string or an array of strings only.
- At-rule names (`@media`, `@layer`, `@keyframes`, etc.) from the property allowlist; at-rules are specified through the `atrules` option, not as property names.

### Fixed
- Properties declared on the `Properties` type but missing from the runtime property allowlist (including `appearance`, `contain`, `touch_action`, `will_change`, `transform_box`, the `mask_border_*` longhands, `font_optical_sizing`, and `text_rendering`) were rejected during CSS generation despite passing type checks. They are now registered.
- Corrected the `hypenate_character` property name to `hyphenate_character`.

## [0.0.14] - 2026-06-28

### Added
- A new optional `centerGutters` field on `LayoutDefaults`. When `center` is called without a `gutters` option, it now applies `centerGutters` as the default inline padding.

## [0.0.13] - 2026-06-28

### Changed
- The layout primitives now embed a human-readable prefix in their generated class names (for example `stack`, `cluster`, and `center-intrinsic`). The class names remain deterministic.

## [0.0.12] - 2026-06-28

### Added
- Component versions of the layout primitives on the `Layout` interface: `Stack`, `Cluster`, `Center`, `Grid`, `Switcher`, `Frame`, `Reel`, `Imposter`, and `Box`. Each returns a layout-only `<div>` with the computed class name applied, and accepts its primitive's options together with the standard `div` attributes. `sidebar` and `cover` have no component version because they require slot-based markup.
- `ElementOpt`, the standard `div` attributes accepted by the component versions (inline `style` is excluded to preserve `style-src 'self'`).
- Exported the per-primitive option types: `StackOpt`, `ClusterOpt`, `CenterOpt`, `GridOpt`, `SwitcherOpt`, `SidebarOpt`, `CoverOpt`, `FrameOpt`, `ReelOpt`, `ImposterOpt`, and `BoxOpt`.
- `cx`, a helper for joining class names that drops falsy values.

## [0.0.11] - 2026-06-28

### Added
- `createLayout`'s `cluster` now accepts an optional `wrap` option (`Properties["flex_wrap"]`) to override its flex-wrap behavior.
- Two new `LayoutDefaults` fields: `clusterWrap`, the default flex-wrap applied by `cluster`, and `sidebarSideWidth`, the default inline size of the sidebar's side slot.

### Changed
- The sidebar's side slot now defaults its `flex-basis` to `sidebarSideWidth` (default `30ch`) instead of `auto`.
- Changed the `sidebarContentMin` default from `50%` to `65ch`.

## [0.0.10] - 2026-06-27

### Added
- New `cirrojs/layout` entry point exporting `createLayout`, a factory that produces the Every Layout primitives (`stack`, `cluster`, `center`, `grid`, `switcher`, `sidebar`, `cover`, `frame`, `reel`, `imposter`, `box`) as typed functions returning deterministic class names. `createLayout` accepts a `LayoutTheme` for overriding the output `css` function and partially overriding the defaults. Also exports the `Layout`, `LayoutTheme`, `LayoutDefaults`, `SidebarSlots`, and `CoverSlots` types.

### Changed
- Replaced the `mediaAtRule?: string` field of `GenCssFnOpt` with `atRules?: string[]`. `genCssFn` now accepts any at-rules directly instead of only a media query condition.
- The dev server now responds with the error's stack trace instead of its string representation when a render throws.

## [0.0.9] - 2026-06-22

### Fixed
- Client scripts no longer throw at runtime. The CSS registry pulled `node:async_hooks` (`AsyncLocalStorage`) into the client bundle, where it is unavailable, causing the script to fail before executing. The client now resolves the registry through the package's `browser` export condition to an async_hooks-free implementation: `css()` only needs the generated class name on the client, so CSS registration becomes a no-op.

## [0.0.8] - 2026-06-21

### Added
- `FileRoute`, a new member of `AnyRoute` alongside `StaticRoute` and `DynamicRoute`, for generating arbitrary text files.
- `markdownToText`, a `cirrojs/server` function that converts Markdown to plain text, primarily for generating search indexes.
- `Registry` type and `runWithRegistry`, exported from the package entry point. `runWithRegistry` runs a render callback in its own registry context and returns both the result and the collected registry.

### Changed
- `StaticRoute` and `DynamicRoute` now require a `type` property. With it, route definitions are type-inferred without wrapping them in `route()`.
- Renamed `createMarkdown` to `createMarkdownProcessor`.
- The CSS registry is now scoped per render via `AsyncLocalStorage` instead of a shared module-global map, preventing styles from different routes from leaking into one another.

### Removed
- Removed `initCssRegistry` and `getCssRegistry`. Use `runWithRegistry` instead. Sites must re-export `runWithRegistry` from their `routes.ts` in place of the two removed functions.
- Removed the `route`, `expandRoutes`, and `urlToFilePath` exports, along with the `ResolvedPage` type. Route definitions no longer need `route()` thanks to the required `type` property.

## [0.0.7] - 2026-06-19

### Added
- The `Island` component now accepts an optional `className` prop, which is applied to its top-level wrapper element.

## [0.0.6] - 2026-06-19

### Fixed
- Fixed a bug that was causing duplicate CSS to be output.

## [0.0.5] - 2026-06-18

### Added
- New `cirrojs/server` entry point exporting the server-only API (`createIsland`, `createMarkdown`, and the `MarkdownConfig`, `RenderResult`, `ToC` types).

### Changed
- Moved `createIsland` and `createMarkdown` from the main entry point (`cirrojs`) to `cirrojs/server` to keep server-only dependencies (`react-dom/server`, remark/rehype/prismjs) out of the client bundle.
- Changed the `genCssFn` signature to take a single `GenCssFnOpt` options object (`{ mediaAtRule?, layer? }`) instead of positional arguments.

## [0.0.4] - 2026-06-17

### Added
- CSS-in-JS system. The `css` and `genCssFn` functions generate scoped styles, and `initCssRegistry` and `getCssRegistry` manage the style registry. All are exported from the package entry point.
- `Properties` and `CssOpt` types.

## [0.0.3] - 2026-06-15

### Fixed
- Fixed the `cirro` CLI binary not being linked correctly on install.

## [0.0.2] - 2026-06-15

### Changed
- Renamed the package from `cirro` to `cirrojs`.

## 0.0.1 - 2026-06-15
- initial release

[Unreleased]: https://github.com/osawa-naotaka/cirro/compare/v0.0.27...HEAD
[0.0.27]: https://github.com/osawa-naotaka/cirro/compare/v0.0.26...v0.0.27
[0.0.26]: https://github.com/osawa-naotaka/cirro/compare/v0.0.25...v0.0.26
[0.0.25]: https://github.com/osawa-naotaka/cirro/compare/v0.0.24...v0.0.25
[0.0.24]: https://github.com/osawa-naotaka/cirro/compare/v0.0.23...v0.0.24
[0.0.23]: https://github.com/osawa-naotaka/cirro/compare/v0.0.22...v0.0.23
[0.0.22]: https://github.com/osawa-naotaka/cirro/compare/v0.0.21...v0.0.22
[0.0.21]: https://github.com/osawa-naotaka/cirro/compare/v0.0.20...v0.0.21
[0.0.20]: https://github.com/osawa-naotaka/cirro/compare/v0.0.19...v0.0.20
[0.0.19]: https://github.com/osawa-naotaka/cirro/compare/v0.0.18...v0.0.19
[0.0.18]: https://github.com/osawa-naotaka/cirro/compare/v0.0.17...v0.0.18
[0.0.17]: https://github.com/osawa-naotaka/cirro/compare/v0.0.16...v0.0.17
[0.0.16]: https://github.com/osawa-naotaka/cirro/compare/v0.0.15...v0.0.16
[0.0.15]: https://github.com/osawa-naotaka/cirro/compare/v0.0.14...v0.0.15
[0.0.14]: https://github.com/osawa-naotaka/cirro/compare/v0.0.13...v0.0.14
[0.0.13]: https://github.com/osawa-naotaka/cirro/compare/v0.0.12...v0.0.13
[0.0.12]: https://github.com/osawa-naotaka/cirro/compare/v0.0.11...v0.0.12
[0.0.11]: https://github.com/osawa-naotaka/cirro/compare/v0.0.10...v0.0.11
[0.0.10]: https://github.com/osawa-naotaka/cirro/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/osawa-naotaka/cirro/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/osawa-naotaka/cirro/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/osawa-naotaka/cirro/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/osawa-naotaka/cirro/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/osawa-naotaka/cirro/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/osawa-naotaka/cirro/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/osawa-naotaka/cirro/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/osawa-naotaka/cirro/compare/v0.0.1...v0.0.2
