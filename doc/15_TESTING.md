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

（当初ここに挙げていた「CI での自動実行」は 10 章で実装済み。）

## 9. カバレッジ計測【実装済み】

### 9.1 なぜ 2 層に分けるのか

カバレッジ計測はテストプロセス**内**でロードされたモジュールしか見ない。しかし本書のテストの
うち `csp.test.ts` と `build-failure.test.ts` は `cirro build` を**子プロセス**として実行する
（4.1 / 7.2）。したがって `vitest --coverage` を素直に掛けると、子プロセスでしか走らない
`runtime/build.ts`・`runtime/dev.ts`・`runtime/cli.ts` が **0%** と表示される。これは
「テストが無い」ではなく「測れていない」であり、両者を同じ数字の上に並べると数字が嘘になる。

そこで計測を 2 層に分ける。

| 層 | 対象 | 手段 | 状態 |
| --- | --- | --- | --- |
| A | テストが直接 import する層（`lib` / `registry` / `server` / `layout` と `runtime` の 7 モジュール・`vite`） | `@vitest/coverage-v8` | 実装済み |
| B | 子プロセスでしか走らない層（`runtime/build.ts`・`dev.ts`・`cli.ts`） | `NODE_V8_COVERAGE` + `c8` | 実装済み（9.4 / 9.5） |

`runtime/` を丸ごと層 B に回さない点に注意する。`router` / `link` / `report` / `icon` /
`validate` / `setup` / `contentType` と `vite/vite.ts` は 7.1 のユニットテストが直接 import して
いるため、層 A で正しく測れる。

### 9.2 層 A の構成

`vitest.config.ts`（新設）に `test.coverage` を置き、`pnpm test:coverage` で実行する。
provider は **v8**。Vitest 4 では AST ベースの remap が既定になり、分岐精度のために istanbul を
選ぶ理由が無くなったため、計装の要らない v8 を採る。

- `include: ["src/**/*.{ts,tsx}"]` を**明示する**。指定しないと「どのテストからも import されない
  ファイル」がレポートから消え、最も知りたい穴（0% のファイル）が見えなくなる。
- `exclude` は次の 3 種のみ。除外の基準は「測っても意味が無い」か「層 B の担当」であり、
  率を上げるための除外はしない。
  - `runtime/{build,cli,dev}.ts` — 層 B の担当（9.1）
  - `lib/fontawesome-{solid,regular,brands}.ts` — `script/genFontAwesomeDefs.ts` の生成物。
    数千行のアイコン定義が 100% 側に積み上がり、全体の率を無意味に押し上げる
  - `registry/registry.browser.ts` — package.json の `browser` 条件でしか解決されないエントリ。
    node 環境のテストからは到達しない
- レポータは `text` / `html` / `json`。`json`（`coverage/coverage-final.json`）は 9.6 の
  マージ用に出しておく。`text` は全指標 100% のファイルを省くため、全ファイルの一覧が要る
  ときは `html` か `json` を見る。
- 閾値（`thresholds`）は置かない。全体一律の数字は薄い箇所を平均で隠す。置くなら憲章に直結する
  ファイル（`registry.ts` / `css.ts` / `markdown.tsx` / `vite.ts`）への per-file 指定とする。

数値は Statements 93.66% / Branches 91.55% / Functions 97.95%（導入時点は 92.19% / 89.17% /
95.91%。レポートを見て埋めた分が 9.3）。最も薄いのは `runtime/setup.ts`（20.83%）で、これは
同ファイルの大半が build 経路からしか呼ばれず、ユニットテストは `appendClientScriptAndCss` だけを
見ている（7.1）ことによる。層 B では 90.51%（9.5）。

### 9.3 レポートを見て埋めた穴

カバレッジは「率を上げる」ためではなく「意図せず検証していない振る舞い」を見つけるために使う。
導入直後のレポートが指した箇所のうち、テストの取りこぼしだったものを埋めた（`layout.tsx` /
`Ogp.tsx` / `rss.ts` / `css.ts` / `router.ts` / `validate.ts` はこれで全指標 100%）。

| 埋めた振る舞い | 落ちていた理由 |
| --- | --- |
| `expandTemporaryRoutes` の css ルートの `render()` | 展開結果の形だけ見て、描画を呼んでいなかった（html 側とは別クロージャ） |
| `reportRouteErrors` の警告出力 | 収集（`validateRoutes`）だけ検証し、報告側が未検証だった |
| 出力パスの制御文字・DEL 拒否 | 拒否リストの他項目はあったが制御文字だけ抜けていた |
| `pageUrl()` の site 無し / pagePath 無し | `absoluteUrl` には同等のテストがあったが `pageUrl` に無かった |
| `rssXml` の site 無し / items 空 | `sitemapXml` には site 無しのテストがあったが `rssXml` に無かった |
| `<Ogp>` の description 皆無時 | 既定 site に description があるため、タグを出さない経路を通っていなかった |
| `center()` の `centerGutters` 既定・`sidebar()` の `auto` 退避 | 組み込み既定が無い／常にある値のため、DI で明示しないと通らない |
| at-rule プリリュードの長さ上限 | セレクタ側の上限テストはあったがアットルール側に無かった |
| `children` を持たない手組み `RuleNode` | 公開型では `children` は任意だが、`ss()` 経由では常に付く |
| 島 props の constructor をたどれないオブジェクト | 報告文字列の `?? "unknown"` 退避が未検証だった |

一方、次は**意図的に埋めていない**。テストのために製品コードへ注入口を作ったり、モジュールを
差し替えたりするのは、テストの都合で設計を歪めるため採らない。

- `runtime/icon.ts` の防御 throw 2 件（`<svg>` ルート不在・sanitize 後の `style=` 残留）。
  FA パッケージのフォーマットが変わった場合にだけ起きるため、`node:fs` の差し替えが要る。
- `registry.ts` / `link.ts` の `URIError` 以外の再 throw。到達には `decodeURI` の差し替えが要る。
- `server/markdown.tsx` の `defaultSchema.clobber ?? []`。上流（hast-util-sanitize）が
  `clobber` を持たなくなった場合の退避で、上流の値に依存する。

### 9.4 層 B が踏むべき注意点

`NODE_V8_COVERAGE` を指定して `cli.sh build --node` を走らせると、生の V8 カバレッジが dump
される。Node の型ストリッピングは型注釈を空白に置換して**文字位置を保存する**ため、
`file://` で始まる URL のエントリは `.ts` 原本にソースマップ無しで 1:1 対応する。

ただし dump には Vite の `ssrLoadModule` が vm で評価したモジュールも混ざり、こちらは
**変換後コードのオフセット**を持つ（URL がスキーム無しの絶対パスで区別できる）。同じ
`lib/css.ts` について両者は別の未カバー行域を報告するため、**混ぜると行の帰属が静かに壊れる**。
そのため `file://` 以外のエントリは捨てる。捨てても損失は無い（`lib/*` は層 A が正面から測る）。
実測では 1 回の採取で 109 件を採用し、Vite が変換した 3062 件を捨てている。

また `NODE_V8_COVERAGE` はテスト内の `execFile` の `env` にだけ渡す。プロセス全体に設定すると
Vitest 自身のワーカーが変換後コードの dump を大量に書き、上記の問題が再発する。

### 9.5 層 B の構成

`script/coverageRuntime.ts` が採取からレポートまでを行う。`pnpm test:coverage:runtime` で実行し、
出力は `coverage-runtime/`（層 A の `coverage/` とは別。層 A は毎回 `coverage/` を消すため）。

1. 子プロセスを走らせるテスト（`csp.test.ts` / `build-failure.test.ts`）だけを `vitest run` で
   実行する。このとき環境変数 `CIRRO_COV_DIR` に dump 先を渡す
2. 各テストは `CIRRO_COV_DIR` があるときだけ、`execFile` の `env` に `NODE_V8_COVERAGE` を
   足して子プロセスを起動する（9.4 のとおりプロセス全体には設定しない）
3. dump から `file://` 以外と `node_modules` 配下を捨てる（9.4）
4. 残りを `c8 report --include='src/runtime/**' --include='src/vite/**'` に掛ける

`csp.test.ts` の `cirro build` にも `--node` を渡すようにした。`build-failure.test.ts` と揃えて
実行 runtime を固定し、bun の有無で結果が変わらないようにするため（dump は node の経路でしか
出ない）。空振り防止として、使えるエントリが 0 件なら「採取できていない」と見なして throw する。

導入時点の数値。`vite/vite.ts` が 100%、層 A では 20.83% だった `runtime/setup.ts` が 90.51%、
層 A の対象外だった `runtime/build.ts` が 88.09%。

| ファイル | Stmts | 備考 |
| --- | --- | --- |
| `vite/vite.ts` | 100% | |
| `validate.ts` | 95.50% | |
| `icon.ts` | 95.23% | |
| `setup.ts` | 90.51% | 層 A では 20.83% |
| `report.ts` | 90.90% | |
| `link.ts` | 90.76% | |
| `build.ts` | 88.09% | 層 A の対象外 |
| `cli.ts` | 75% | 未カバーは usage 表示と非ゼロ終了 |
| `router.ts` | 67.27% | 未カバーは `expandTemporaryRoutes`（dev 専用） |
| `dev.ts` | 10.59% | dev サーバのテストが無い（8 章） |

### 9.6 2 つのレポートを統合しない理由

層 A と層 B は**別の問いに答える**ため、1 つの率にまとめない。

- 層 A は「その振る舞いにテストがあるか」。低ければテストを足すべきである
- 層 B は「実際の build 経路が何を実行するか」。低いことが必ずしも欠陥を意味しない

同じファイルが両方に出て数字が食い違うのは正常である。例えば `runtime/router.ts` は層 A で
100%、層 B で 67.27%。差分の `expandTemporaryRoutes` は dev 専用で build からは呼ばれないため、
**この食い違い自体が行の帰属が正しいことの裏付け**になっている。これを平均すると、どちらの
問いにも答えない数字になる。

統合が必要になった場合は、双方が istanbul 形式の `coverage-final.json`（`coverage/` と
`coverage-runtime/`）を出しているため、`istanbul-lib-coverage` の `createCoverageMap` で
マージできる。

## 10. CI（GitHub Actions）【実装済み】

### 10.1 検査点は PR の 1 箇所

publish は main への push で走る（`publish-main.yml` / `publish-create-cirro.yml`）。つまり
**main にマージされた時点でもう公開処理が始まる**ため、実質的な検査点は PR しかない。
`ci.yml` を `pull_request`（main 宛）と `workflow_dispatch` で走らせ、そこを唯一のゲートとする。

work ブランチへの push では**走らせない**。作業ブランチは部分的に壊れた状態を置ける場所として
使うためである。CI が守るべきは main の中身であって、作業中のコミットではない。

内容は install → lint → typecheck → test の 4 段。

- テストは `examples/basic` / `examples/blog` と `test/fixtures/` を実際に `cirro build` するため、
  ワークスペース全体を `pnpm install --frozen-lockfile` で入れる（packages だけでは足りない）。
- Node は 24。この経路は `node --eval` で `src/runtime/cli.ts` を直接読むため型ストリッピング
  （22.18 以上）が要る。公開パッケージは `dist` を指すので、これは開発時のみの要件である。
- 子プロセスの実行 runtime は両テストとも `--node` で固定済みのため（9.5）、runner に bun が
  無くても結果は変わらない。
- lint 用に `pnpm --filter cirrojs run lint`（`biome check`、`--write` 無し）を追加した。
  既存の `format` は `--write` するのでゲートには使えない（勝手に直して緑になる）。
  あわせて `biome.json` の `files.includes` で `dist` / `coverage` / `coverage-runtime` を
  除外した。除外しないと `test/fixtures/*/dist` のビルド成果物を lint し、`format` が
  それを書き換えてしまう。

### 10.2 publish 側にもテストを 1 段置く

`publish-main.yml` の typecheck と build の間に `pnpm --filter cirrojs run test` を追加した。
通常は `ci.yml` が PR の時点で通しているが、`workflow_dispatch` での手動 publish と、PR を
経ずに main へ入ったコミットはここでしか止められない。`publish-create-cirro.yml` は元から
テストをゲートにしており、対称になる。

### 10.3 CI に入れないもの

- **カバレッジ**。閾値を置いていない以上、走らせても合否の信号にならない（9.2）。必要なときに
  手元で `pnpm test:coverage` を実行する。
- **層 B（`pnpm test:coverage:runtime`）**。`csp.test.ts` / `build-failure.test.ts` と同じビルドを
  再実行するため、テスト時間がほぼ二重になる。層 B は「次にどこへテストを足すか」を決める
  ための道具であり、ゲートではない（9.6）。副作用として `script/coverageRuntime.ts` 自体は
  CI で叩かれないため、壊れた場合は次に使ったときに気づくことになる。
- **publish トリガの変更**。`push: main` のままとする。正しく publish された結果に対して
  タグを打つ運用のため（タグ起動にすると順序が逆になる）。

## 付録

### 関連ドキュメント

- `01_CHARTER.md` — インラインゼロが存在意義であることの原典
- `02_CLIENT_SCRIPT_BUNDLING.md` / `04_USAGE.md` 3.3 — インラインの発生源がバンドラ側にもある
  ことの背景（1 章の根拠）
- `09_LINK_SAFETY.md` — 全件収集・一括報告の方針（4.2 が踏襲）と、製品側で HTML パーサを
  避けた判断（3.1 との対比）
- `11_TODO.md` — 本書の出発点（課題 5）
