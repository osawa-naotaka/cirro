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

[Unreleased]: https://github.com/osawa-naotaka/cirro/compare/v0.0.21...HEAD
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
