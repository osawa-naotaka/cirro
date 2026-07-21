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

## 5. テスト整備【仕様確定・実装待ち】

### 背景

現状テストが存在しない。Cirro の存在意義は「生成物にインラインスクリプト・インライン
スタイルが一切ない」ことであり、これが回帰で壊れると製品価値の根幹が崩れる。
機能追加よりも優先度の高い投資である。

### 仕様

**`15_TESTING.md` として確定済み**。要点: ランナーは Vitest。3 つの examples を実際に
`cirro build` し、`dist/` の全 HTML / SVG を parse5 で走査して、CSP の意味論に立脚した
5 種の違反（src なし script・`on*` 属性・`javascript:` URL・style 要素・style 属性）が
ゼロであることを検証する。空振り防止のメタ検証（html が 1 件以上・島マウンタ script の
存在等）を同時に行う。

### 作業項目

- [x] テストランナーの選定と保証テストの仕様確定（→ `15_TESTING.md`）
- [x] インラインゼロ保証テストの実装（`packages/cirrojs/test/`。ルート `pnpm test` で実行）。
      初回実行で FA スプライトのルート `style="display: none;"` を検出し、配信時に除去する
      よう修正した（`runtime/icon.ts` の `loadSprite`・`10_IMAGE_ASSETS.md` 5.7 に反映）
- [x] 機能別テスト P1（憲章の中核）: `css.test.ts`（64）/ `markdown-sanitize.test.ts`（35）/
      `island.test.ts`（13）/ `vite-plugin.test.ts`（13）/ `icon.test.ts`（11）。
      「インラインゼロが**なぜ**成立しているか」を名指しで固定する層。`csp.test.ts` が
      結果を守り、この層がその根拠（CSS 文字列組み立ての注入防御・サニタイズの防衛線の位置・
      `data-props` のエスケープ・Vite 設定注入・FA スプライトの style 除去）を守る。
- [x] 機能別テスト P2（silent failure 系）: `router.test.ts`（24）/ `link.test.ts`（29）/
      `registry.test.ts`（51）/ `report.test.ts`（19）。壊れても緑になる領域
      （リンク綴りの生成・ルート展開・レンダリングコンテキストの分離・報告の variant 網羅）。
      あわせて `tsconfig.test.json` を追加し、`pnpm typecheck` が test も検査するようにした
      （`report.test.ts` の cause 網羅表が型エラーとして効くようにするため）。
- [ ] 機能別テスト P3（公開 API の振る舞い）: `layout.tsx` のプリミティブ・
      `Link`/`Image`/`FaImage`・`misc`/`contentType`/`appendClientScriptAndCss`
- [ ] ビルド失敗系の結合テスト（`15_TESTING.md` 7 章。意図的なリンク切れ等で非ゼロ終了）

---

## 6. 保留中の小粒課題【未決定】

以下は検討済みだが実施判断をしていないもの。上記 1〜5 の後に再検討する。

| 課題 | 概要 |
| --- | --- |
| 404 ページの生成規約 | Cloudflare は `404.html` を拾う。ルート定義での宣言方法を検討 |
| `_headers` の CSP 自動生成 | 現状は利用者が meta タグを手書き。ビルドが推奨 CSP ヘッダを出力するところまで面倒を見るか |
| `aria-current="page"` の自動付与 | `09_LINK_SAFETY.md` 6 章の将来候補。ナビの現在地表示が JS ゼロで正しくなる |
| 画像 width / height の自動付与 | `10_IMAGE_ASSETS.md` 7 章の将来候補。CLS をビルド時に潰せる |
| コンポーネントライブラリ | スタイリング API のドッグフーディングとして有望。本体の土台（特に 1・5）を固めてから着手 |

---

## 付録

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（課題 1 の修正対象）
- `04_USAGE.md` — 利用ガイド（課題 1・2・3 の反映先）
- `09_LINK_SAFETY.md` — リンク安全性（課題 3 の設計原典）
- `10_IMAGE_ASSETS.md` — 画像アセット（課題 3 の画像対応・width/height 自動付与）
