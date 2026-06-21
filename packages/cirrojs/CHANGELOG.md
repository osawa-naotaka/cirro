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

- AnyRouteにStaticRoute, DynamicRouteに加え、FileRouteを追加。任意のテキストファイルを生成できるようにした
- StaticRoute, DynamicRouteにtypeプロパティを追加。今後は設定が必須になる。その代わり、もはやroute()を使わなくても型推論してくれる

### Changed
- The CSS registry is now scoped per render via `AsyncLocalStorage` instead of a shared module-global map, preventing styles from different routes from leaking into one another.

### Removed
- Removed `initCssRegistry` and `getCssRegistry`. Use `runWithRegistry`, which runs a render callback in its own registry context and returns both the result and the collected registry. Sites must re-export `runWithRegistry` from their `routes.ts` in place of the two removed functions.

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

[Unreleased]: https://github.com/osawa-naotaka/cirro/compare/v0.0.7...HEAD
[0.0.7]: https://github.com/osawa-naotaka/cirro/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/osawa-naotaka/cirro/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/osawa-naotaka/cirro/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/osawa-naotaka/cirro/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/osawa-naotaka/cirro/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/osawa-naotaka/cirro/compare/v0.0.1...v0.0.2
