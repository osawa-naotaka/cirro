# テスト整備の設計 - インラインゼロ保証テスト

本ドキュメントは、Cirro のテスト整備（`11_TODO.md` 課題 5）のうち、最優先である
**インラインゼロ保証テスト**（生成物にインラインスクリプト・インラインスタイルが一切ないことの
自動検証）の**設計判断とその理由**を記録するものである。機能別のユニットテストは段階的に
追加するものとし、本書のスコープ外とする（7 章）。

関連実装（予定）: `packages/cirrojs/test/`（新設）/ `packages/cirrojs/package.json`（scripts・
devDependencies）/ `examples/*`（テストのビルド対象）。

---

## 1. 問題設定

Cirro の存在意義は「生成物にインラインスクリプトが一切なく、`unsafe-inline` なしの厳格 CSP で
配信できる」ことである（`01_CHARTER.md`）。これが回帰で壊れると製品価値の根幹が崩れるが、
現状これを保証するテストは存在しない。逆に言えば、この 1 本があれば、機能追加・依存更新
（特に Vite のメジャーアップデート）のたびに製品の核が自動で守られる。

重要なのは、**インラインの発生源はレンダラ（react-dom）だけではない**ことである。Astro が
解決できなかった「ごくわずかなインライン」はバンドラ由来（モジュールプリローダの polyfill 等）
であり、Cirro はそれを Vite の設定注入（`assetsInlineLimit: 0`・`modulePreload.polyfill: false`）で
封じている（`04_USAGE.md` 3.3）。したがって保証の対象は「レンダリング結果」ではなく
**`cirro build` が書き出した最終成果物**でなければならない。

## 2. 設計原則

> 実際の examples を `cirro build` でビルドし、`dist/` の全 HTML / SVG を HTML パーサで走査して、
> インラインスクリプト・インラインスタイルに該当する要素・属性がゼロであることを検証する。
> 検証は CSP の意味論に立脚する（`script-src 'self'` / `style-src 'self'` が禁じるものを違反と
> 定義する）。

- テストランナーは **Vitest** とする。Vite ベースの構成と自然に整合し、TypeScript を直接実行でき、
  追加のトランスパイル設定が不要。
- examples（basic / blog / noisland）をそのままテストフィクスチャとする。機能追加が examples に
  反映される運用（ドッグフーディング）と噛み合い、**新機能の出力が自動的に検証対象へ入る**。

## 3. 検討して不採用にした案

### 3.1 正規表現による走査（不採用）

`<script(?![^>]*src=)` のような正規表現で HTML を走査する案。依存ゼロで済むが、HTML の
字句構造（属性値内の `>`・大文字小文字・空白変化）に対して**偽陰性**が構造的に排除できない。
この保証テストにおける偽陰性は「インラインが混入したのに緑になる」ことを意味し、テストの
存在価値を無効化する。仕様準拠の HTML パーサ（**parse5**）を devDependency として採用する。

なお `09_LINK_SAFETY.md` 3.2 では「HTML パーサへの依存」を理由に post-build スキャンを
退けたが、あれは**製品機能**（利用者に見える薄さ・エラーとソース位置の対応）の判断である。
テストは配布物に含まれず、走査の網羅性が薄さより優先される。矛盾しない。

### 3.2 レンダリング結果のユニットテストで済ませる（不採用）

`renderToStaticMarkup` の出力文字列を直接検査する案。ビルドを伴わないため高速だが、
1 章のとおりインラインの発生源はバンドラ側にもあるため、**保証すべき対象（最終成果物）を
検証していない**ことになる。ユニットテストは機能別テスト（7 章）の道具であり、この保証の
主役にはならない。

### 3.3 成果物のスナップショットテスト（不採用）

`dist/` の HTML をスナップショット比較する案。何が保証されているのかがスナップショットから
読み取れず、意図した変更のたびに `--update` で更新され形骸化する。「インラインゼロ」という
**性質（property）を明示的に検査する**方が、テストの失敗メッセージも保証内容も明確になる。

### 3.4 ブラウザ実行（E2E）による検証（スコープ外）

Playwright 等で実ブラウザに CSP ヘッダ付きで読み込ませ、CSP violation イベントを監視する案。
保証としては最強だが、ブラウザ依存の導入コストが大きい。静的走査で「インラインが存在しない」
ことは完全に検証できる（CSP violation は存在の帰結にすぎない）ため、初期フェーズでは不要。
ハイドレーション動作の検証（島が実際に動くか）とあわせて将来候補とする（7 章）。

## 4. 採用した設計

### 4.1 構成と実行方法

- テストは `packages/cirrojs/test/csp.test.ts`（インラインゼロ保証）として置く。
  devDependencies に `vitest` と `parse5` を追加し、`"test": "vitest run"` を scripts に追加する。
  ルートの package.json からは `pnpm -C packages/cirrojs test` で委譲する。
- テストは example ごとに `beforeAll` で **`pnpm exec cirro build` を子プロセスとして実行**する
  （cwd を example ディレクトリに設定）。実際の CLI 経路（`cli.sh` → runtime）を通すことで、
  ランタイムの設定注入を含めた本物のビルドを検証する。ビルドを伴うためタイムアウトは
  余裕を持たせる（例: 120 秒）。
- 対象 example は **basic（最小・島あり）/ blog（Markdown・ハイライト・FaImage・レシピ）/
  noisland（島なし構成）** の 3 つ。パイプラインの経路が異なるため、3 つで主要な出力形を覆う。

### 4.2 違反の定義（CSP の意味論に立脚）

`dist/` 配下の全 `.html` と `.svg` をパースし、全要素を走査して次を違反とする。
`.svg` を含めるのは、SVG が `<script>` とイベントハンドラ属性を持ち得るためである
（FaImage のスプライトコピーもこれで検証される）。

| # | 違反 | 対応する CSP 条項 |
| --- | --- | --- |
| V1 | `src` 属性を持たない `<script>` 要素（中身が空でも違反） | `script-src 'self'`（インラインスクリプト） |
| V2 | `on` で始まる名前の属性（`onclick` 等、大文字小文字を問わない） | 同上（イベントハンドラ属性） |
| V3 | `href` / `src` / `action` / `formaction` / `xlink:href` の値が `javascript:` スキーム（空白・大文字小文字の変化を許容して判定） | 同上（CSP は `javascript:` URL をインラインスクリプト扱いする） |
| V4 | `<style>` 要素 | `style-src 'self'`（インラインスタイル） |
| V5 | `style` 属性を持つ要素 | 同上（`style` 属性） |

- 違反は throw せず全件収集し、**ファイルパス・要素名・該当属性**を含めて一括で報告する
  （アサーション失敗メッセージに全違反を列挙する。修正のしやすさを優先する製品側の報告方針
  （`09_LINK_SAFETY.md` 4.5）とテストでも一貫させる）。
- 許可リスト（例外）は設けない。「例外が 1 つでも必要になったらそれは製品の欠陥」という
  位置づけを保つ。

### 4.3 空振り防止（テスト自体の健全性）

保証テストは「何も見つからないこと」を検証するため、**走査自体が空振りしても緑になる**
危険がある。次のメタ検証を同時に行う。

- 各 example の `dist/` に `.html` が 1 件以上存在すること（ビルド出力先の変更等で走査対象が
  ゼロになったら失敗する）。
- basic / blog では `src` 属性付きの `<script>`（島マウンタ）が 1 件以上存在すること
  （「script が 1 つもない＝インラインもない」という縮退で緑になっていないことの確認）。
- blog では `<link rel="stylesheet">` が存在すること（CSS が外部ファイルとして配信されている
  ことの正側の確認）。

### 4.4 dev サーバ出力は対象外

`cirro dev` の出力には Vite が HMR クライアント等のインラインスクリプトを注入するが、これは
開発時専用の仕様であり（`04_USAGE.md` 9.1）、保証の対象は `cirro build` の成果物のみとする。

## 5. 制約と非目標

- **CSP meta タグの内容は検証しない**。meta の出力は利用者の任意（`04_USAGE.md` 9.1）であり、
  Cirro の保証は「インラインが存在しないこと」まで。
- **XML / JSON 等のファイルルート出力は走査しない**（HTML として解釈されないため）。sitemap /
  RSS（`12_SITE_METADATA.md`）実装後も同様だが、必要になれば拡張する。
- **リンク切れ・画像参照はこのテストの対象外**（製品自身のビルド時検証が担う。むしろ examples に
  意図的なリンク切れを置いて build が非ゼロ終了することの検証は、機能別テスト（7 章）の題材）。
- **ハイドレーションの動作検証はしない**（3.4。将来候補）。

## 6. 実装順序

1. `packages/cirrojs` に vitest + parse5 を導入し、`test/csp.test.ts` を実装する
   （4.2 の V1〜V5 + 4.3 のメタ検証）
2. 3 example でパスすることを確認する
3. ルート package.json への `test` スクリプト追加
4. `04_USAGE.md` 等への記載は不要（利用者向け機能ではないため）。`11_TODO.md` の課題 5 を更新する

## 7. 機能別テストと結合テスト【実装済み】

本書の主題であるインラインゼロ保証テストに続けて、機能別テストとビルド失敗系の結合テストを
追加した。ランナーは同じ Vitest。`pnpm typecheck` は `tsconfig.test.json` 経由で `test/` も
検査する（テスト側の型レベルの網羅チェックを機能させるため）。

### 7.1 機能別ユニットテスト

優先順位は「憲章（インラインゼロ・サニタイズ）の裏口になりうるか」と「壊れても静かに間違うか」
の 2 軸で決めた。`csp.test.ts` が「結果としてインラインが無い」ことを守るのに対し、こちらは
**なぜそれが成立しているのか**を名指しで固定する層である。

| ファイル | 対象 |
| --- | --- |
| `css.test.ts` | `stringifyCss` の出力形・`$`/`&` の解決規則・グローバル規則判定・セレクタ/アットルール/宣言への注入防御・`toKeyframes`・ハッシュの決定性 |
| `markdown-sanitize.test.ts` | 生 HTML の不通過・危険スキームの除去・ユーザー plugin が sanitize を越えられないこと・toc の id・highlight のクラスベース性 |
| `island.test.ts` | `data-props` のエスケープ往復と CSP 違反ゼロ・レジストリ照合 |
| `vite-plugin.test.ts` | `assetsInlineLimit: 0` / `modulePreload.polyfill: false` 等の設定注入・島マウンタ仮想モジュール |
| `icon.test.ts` | `loadSprite` のルート `style` 除去・`bundleIcon` の書き出し |
| `router.test.ts` | `expandRoutes` / `expandTemporaryRoutes` の展開と遅延評価 |
| `link.test.ts` | `cleanUrlPath` / `collectLinks` の綴り生成・`listPublicFiles` |
| `registry.test.ts` | `checkLink` / `checkImage` の分類・コンテキスト分離・`styleSample` |
| `report.test.ts` | `ErrorInfo` の全 variant にメッセージがあること（Record 型で網羅を型検査） |
| `layout.test.ts` | レイアウトプリミティブの出力・defaults の DI・決定性・コンポーネント版 |
| `components.test.ts` | `Link` / `Image` / `FaImage` の描画と違反収集 |
| `misc.test.ts` | `join` / `escapeXml` / `contentType` / `appendClientScriptAndCss` |

### 7.2 ビルド失敗系の結合テスト

`build-failure.test.ts` が `test/fixtures/` 配下の 3 つのフィクスチャを実際の CLI 経路
（`cli.sh --node` → runtime）でビルドし、終了コードと報告内容を検証する。

- `valid/` — 違反ゼロ。終了コード 0 と「違反なし」の報告。**空振り防止の対照群**であり、
  以下の非ゼロが「フィクスチャの配線ミスで落ちているだけ」でないことを保証する。
- `broken-refs/` — 描画中に収集される 9 種の違反（リンク 2・画像 2・島 2・site・Markdown 参照 2）。
  非ゼロ終了・違反が起きたページ path の明示・**全件を 1 パスで報告**すること・
  それでも成果物は書き出すことを検証する。
- `broken-routes/` — ルート展開後の違反（パス形式・重複・public 衝突）。public 衝突は
  配信される綴り（`/collide.html` と `/collide`）の両方で報告されることまで見る。

フィクスチャは examples ではなく `packages/cirrojs/test/fixtures/` に置く。意図的に壊した
サイトを利用者向けの雛形と混ぜないためである。各フィクスチャに package.json は置かない。
依存（react / vite / @vitejs/plugin-react）は親の `packages/cirrojs/node_modules` から解決され、
`cirrojs` 自身は package.json の自己参照で解決されるため、`pnpm install` の追加設定は不要。

## 8. 残る拡張候補

- **E2E（ブラウザ）検証**: CSP ヘッダ付き配信での violation 監視と、島のハイドレーション動作
  （3.4）。静的走査では確認できない「島が実際に動くか」を担保する唯一の手段。
- **dev サーバの結合テスト**: 現状 `runtime/dev.ts` にテストが無い（4.4 のとおり dev 出力は
  インラインゼロ保証の対象外だが、ルーティングと full-reload の挙動は検証しうる）。
- **CI（GitHub Actions）での自動実行**: リリースフロー（タグ打ち）との連携も含めて別途検討。

## 付録

### 関連ドキュメント

- `01_CHARTER.md` — インラインゼロが存在意義であることの原典
- `02_CLIENT_SCRIPT_BUNDLING.md` / `04_USAGE.md` 3.3 — インラインの発生源がバンドラ側にもある
  ことの背景（1 章の根拠）
- `09_LINK_SAFETY.md` — 全件収集・一括報告の方針（4.2 が踏襲）と、製品側で HTML パーサを
  避けた判断（3.1 との対比）
- `11_TODO.md` — 本書の出発点（課題 5）
