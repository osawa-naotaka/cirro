# 今後の実装課題 - TODO

本ドキュメントは、2026-07-19 の検討で決定した方針と今後の実装課題を記録するものである。
各課題は着手時に具体的な仕様を検討し、必要に応じて個別の設計ドキュメントを作成する。
完了した課題は本ドキュメントから削除し、成果を該当ドキュメント（`04_USAGE.md` 等）へ反映する。

---

## 1. 方針転換: 「島ゼロのページは JS ゼロ」を憲章から外す【完了 2026-07-19】

完了済み。全ページ共有の単一 JS バンドルを正式な設計判断とし、次へ反映した。

- `01_CHARTER.md` — 1.3「軽量」の定義・2.1 非機能要件を修正し、2.3 スコープ外に
  「ページ単位の JS 分割」を理由付きで追加
- `04_USAGE.md` 6.1 — 設計として書き直し、重い島の逃げ道（`React.lazy` + dynamic import）を
  利用パターンとして記載
- `02_CLIENT_SCRIPT_BUNDLING.md` 3〜4 章 — 「憲章違反」の記述を「採用した設計と
  トレードオフ」に改稿。`03_ISLAND_SYSTEM.md` / `10_IMAGE_ASSETS.md` の関連記述も更新
- dynamic import のチャンク分割は examples/basic で**検証済み**（分割チャンクは別ファイルに
  emit され共有バンドルに含まれない・`<script>` は 1 本のまま・インラインスクリプトなし）

---

## 2. sitemap / RSS / OGP ヘルパー【完了 2026-07-19】

完了済み。仕様は `12_SITE_METADATA.md`、使い方は `04_USAGE.md` 5.7、実例は `examples/blog`。

- `defineSite()` / `createRouteFn({ content, site })`（破壊的変更・CHANGELOG 記載）
- `absoluteUrl()` / `pageUrl()` + Store 拡張（site・現在ページ path・html ページ一覧・
  site-required 違反の収集と報告レール。file ルートもレンダリングコンテキストで包むようになり、
  RSS item のリンク検証が乗る）
- `sitemapXml()` / `rssXml()` / `<Ogp>`（ユニットテスト `test/site.test.ts` 25 件）

---

## 3. Markdown 本文中の参照検証【完了 2026-07-20】

完了済み。仕様は `13_MARKDOWN_REF_CHECK.md`、使い方は `04_USAGE.md` 7.5。

- sanitize 後の信頼済み層に組み込みプラグイン `rehypeCheckRefs` を配置し、`a href` / `img src` を
  `checkLink` と共有の分類（`classifyLink`）で検証。violation は `markdown-ref` variant として
  ErrorInfo レールに乗る（既定オン・`checkRefs: false` で無効化・コンテキスト外はスキップ）。
- `09_LINK_SAFETY.md` / `10_IMAGE_ASSETS.md` の「検証しない」記述を更新済み。
  テスト: `test/markdown-ref.test.ts`（18 件。ユーザープラグインが生成したリンクの検証を含む）。

---

## 4. スキャフォールディングとビルド時チェック【完了 2026-07-20】

完了済み。仕様は `14_CONFIG_VALIDATION.md`（チェック）と `16_SCAFFOLDING.md`（雛形生成）。

- **ビルド時チェック**: 検査点①〜④をすべて実装（設定解決時の fail-loud・ルート展開後の
  重複/パス形式/public 衝突・島の使用照合と props 直列化検証・@layer 宣言漏れ警告）。
  報告は ErrorInfo の統合レールに乗せた。調査項目（S3 勝者・S10 react 順序）の結果は
  `14_CONFIG_VALIDATION.md` 冒頭に記録。`05_STYLING.md` 7.2 / `04_USAGE.md` 3.1 の
  実装より古い記述も修正済み。テスト: `test/validate.test.ts`（36 件）。
- **スキャフォールディング**: `packages/create-cirro`（`pnpm create cirro <dir>`）。
  examples/basic 由来のテンプレートを同梱した依存ゼロの CLI。cirrojs リリース時に
  テンプレートの依存バージョンを更新する（`16_SCAFFOLDING.md` 4.1）。

---

## 5. テスト整備【完了 2026-07-21】

完了済み。仕様と実装内容は `15_TESTING.md`（保証テストの設計判断は 1〜6 章、機能別テストと
結合テストの一覧は 7 章）。

- **インラインゼロ保証テスト**: 3 つの examples を実際に `cirro build` し、`dist/` の全
  HTML / SVG を parse5 で走査（`test/csp.test.ts`）。初回実行で FA スプライトのルート
  `style="display: none;"` を検出し、配信時に除去するよう修正した（`runtime/icon.ts` の
  `loadSprite`・`10_IMAGE_ASSETS.md` 5.7 に反映）。
- **機能別ユニットテスト**: 12 ファイル。「憲章の裏口になりうるか」「壊れても静かに間違うか」
  の 2 軸で優先順位を決めた（`15_TESTING.md` 7.1）。`hasGlobalRule` が属性後方一致マッチャー
  `$=` を自クラス参照と誤認するバグを、テスト作成中に発見して修正済み（CHANGELOG 記載）。
- **ビルド失敗系の結合テスト**: `test/fixtures/` の 3 フィクスチャを実際の CLI 経路でビルドし、
  終了コードと報告内容を検証（`15_TESTING.md` 7.2）。違反ゼロの対照群を同時に置いて空振りを防ぐ。
- **型検査の拡張**: `tsconfig.test.json` を追加し `pnpm typecheck` が `test/` も検査する。
  `report.test.ts` の cause 網羅表（Record 型）が、`ErrorInfo` に variant を足したときに
  型エラーとして効くようにするため。

- **カバレッジ計測**: 2 層構成（`15_TESTING.md` 9 章）。層 A は `vitest.config.ts` +
  `@vitest/coverage-v8`（`pnpm test:coverage`）。子プロセスでしか走らない
  `runtime/{build,cli,dev}.ts` は「測れていない」だけなので層 A から外し、層 B が
  `NODE_V8_COVERAGE` + `c8` で測る（`script/coverageRuntime.ts` / `pnpm test:coverage:runtime`）。
  dump のうち Vite が変換したエントリを捨てないと行の帰属が壊れる点が要点（9.4）。
  2 つのレポートは統合しない。別の問いに答えるものだから（9.6）。

計 17 ファイル・507 ケース。残る候補（E2E・dev サーバ・CI）は `15_TESTING.md` 8 章。

---

## 6. 保留中の小粒課題【未決定】

以下は検討済みだが実施判断をしていないもの。上記 1〜5 が完了したため、次はここから選ぶ。

| 課題 | 概要 |
| --- | --- |
| 404 ページの生成規約 | Cloudflare は `404.html` を拾う。ルート定義での宣言方法を検討 |
| `_headers` の CSP 自動生成 | 現状は利用者が meta タグを手書き。ビルドが推奨 CSP ヘッダを出力するところまで面倒を見るか |
| `aria-current="page"` の自動付与 | `09_LINK_SAFETY.md` 6 章の将来候補。ナビの現在地表示が JS ゼロで正しくなる |
| 画像 width / height の自動付与 | `10_IMAGE_ASSETS.md` 7 章の将来候補。CLS をビルド時に潰せる |
| コンポーネントライブラリ | スタイリング API のドッグフーディングとして有望。本体の土台（1〜5）が固まったので着手可能 |

---

## 付録

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（課題 1 の修正対象）
- `04_USAGE.md` — 利用ガイド（課題 1・2・3 の反映先）
- `09_LINK_SAFETY.md` — リンク安全性（課題 3 の設計原典）
- `10_IMAGE_ASSETS.md` — 画像アセット（課題 3 の画像対応・width/height 自動付与）
