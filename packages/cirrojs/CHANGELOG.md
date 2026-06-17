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

[Unreleased]: https://github.com/osawa-naotaka/cirro/compare/v0.0.4...HEAD
[0.0.4]: https://github.com/osawa-naotaka/cirro/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/osawa-naotaka/cirro/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/osawa-naotaka/cirro/compare/v0.0.1...v0.0.2
