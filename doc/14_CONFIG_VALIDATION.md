# 設定ミス検出の設計 - ビルド時チェック

本ドキュメントは、silent failure（設定を間違えてもエラーが出ず、遠くで静かに壊れる）に
なりうる設定ミスの洗い出しと、それらをビルド時・開発時に検出する仕組みの**設計判断とその理由**を
記録するものである。`11_TODO.md` の課題 4 の前半（ビルド時チェック）の設計にあたる。
スキャフォールディング（雛形生成）は本書のスコープ外とし、チェック群の導入後に別途検討する。

関連実装（予定）: `packages/cirrojs/src/vite/vite.ts` / `runtime/setup.ts` / `runtime/router.ts` /
`runtime/dev.ts`・`runtime/build.ts` / `registry/registry.common.ts`・`registry.ts` /
`server/island.tsx`。

---

## 1. 問題設定

Cirro には「設定を間違えると、エラーではなく**動作の欠落や dev / build の食い違い**として現れる」
箇所が残っている。フレームワークの採用障壁は機能不足よりもこの種の壊れ方で生じる。

なお、調査の結果、**代表的な footgun と目されていた項目は既に fail-loud であった**。
`setup.ts` の `loadRoutesModule` が次を throw で検出している。

- `routes.ts` の `runWithRegistry` 再 export 忘れ
- routes の default export 忘れ / `defineRoutes()` を通していない形状
- content ハンドルの loader 欠落

一方、`05_STYLING.md` 7.2 の「これを書かないと CSS が生成されない」という記述は実装より古い
（現在は**ビルドがエラーで停止する**）。ドキュメント側の修正を作業項目に含める（6 章）。

### 1.1 洗い出した silent failure（2026-07 実装調査）

深刻な順。「壊れ方」列が本書の主眼である（エラーが出ない・遠くで壊れる・dev と build で違う）。

| # | 設定ミス | 現状の壊れ方 |
| --- | --- | --- |
| S1 | `<Island>` を使っているのに `cirro({ islands })` 未設定 | 仮想マウンタが空モジュールになり（`vite.ts` の `load()` が `""` を返す）、**ハイドレーションが一切走らない。エラーはどこにも出ない** |
| S1' | `options.islands` の指すレジストリと `createIsland()` に渡したレジストリが別ファイル | マウンタが `!(name in islands)` で**未知の島を黙ってスキップ**。`08_CONTENT_LAYER.md` 3.3 で退けた「コンフィグのパスと型の由来の断絶」が islands に残っている |
| S2 | 出力パスの重複（slug 重複・静的ルートの重複宣言） | `expandRoutes` は検出せず、**build は後勝ちで上書き・dev は先勝ち**。silent かつ dev / build で表示が食い違う |
| S3 | `public/` のファイルとルートの出力パスが衝突 | dev は Vite ミドルウェアが先に public を配信、build は `writeToFile` がコピー後に上書きするため、**dev は public 勝ち・build はルート勝ちになると見られる**（実装時に要確認・記録） |
| S4 | ルート `path` の形式違反（`/` 始まりでない・html ルートが `.html`/`.htm` 終端でない・`..` `\` `//` 等を含む） | 無検証。リンク照合（`09_LINK_SAFETY.md` 4.4）は「path は html ファイルの exact な名前」を前提とするため、**照合の偽陰性・偽陽性として遠くで壊れる** |
| S5 | `<Island>` の props が JSON 直列化不能（関数・`undefined`・`Date`・ReactNode 等） | `JSON.stringify` が**黙って落とす／型を変える**。SSR は本来の props、クライアントは欠けた props で動き、hydration mismatch や動作不良として現れる。型は `ComponentProps<R[K]>` なので `onClick` 等が通ってしまう |
| S6 | `cssUrl` の形式違反（`/` 始まりでない等） | 相対 URL として出力され、**下層ページでだけ** CSS が 404 になる |
| S7 | `watchDir` が実在しない | watcher が沈黙し、**HMR / full-reload が効かないだけ**でエラーは出ない |
| S8 | 島レジストリの default export 忘れ | build は Rollup エラー（fail-loud）だが、**dev はブラウザコンソールにしか出ない** |
| S9 | `@layer` ブロックを使っているのに文アットルール（`defineCascadeLayer()` 等）で宣言していない | レイヤー優先順が「初出順」になり、意図とズレたカスケードが**スタイルの微妙な崩れ**として現れる |
| S10 | `react()` を `cirro()` より後に置く | 存在チェックのみで**順序は未検証**。そもそも順序が実際に必要かも未検証（調査項目。6 章） |

## 2. 設計原則

> 設定そのものの誤り（コンテンツに依存しない）は**設定解決時に即 throw**、
> コンテンツに依存して初めて確定する違反は**全件収集して build は一括報告 + 非ゼロ終了、
> dev は警告**とする。検出はすべてレンダリング前後の既存の流れの中で行い、
> 生成後の成果物は走査しない。

- 「throw せず、集めて、まとめて出す」は brokenLinks / brokenImageSrc（`09_LINK_SAFETY.md` 4.5）
  の既存レール。slug 重複のようなコンテンツ起因の違反は全件報告の方が直しやすい。
- 逆に `cssUrl` の形式のような純粋な設定ミスは、収集する意味がなく最初のビルドで必ず気づくべき
  ものなので fail-loud とする。`defineSite()` の origin 検証（`12_SITE_METADATA.md` 4.1）と同じ判断。
- 検査点は次の 4 つに整理する。新設が必要なのは②と③の一部のみで、報告機構はすべて既存レールに乗る。

| 検査点 | タイミング | 報告 | 対象 |
| --- | --- | --- | --- |
| ① 設定解決時 | `setupCirro` / `configResolved` | 即 throw | S6・S7・ファイル実在 |
| ② ルート展開後 | `expandRoutes` 直後（dev / build 共有） | 収集 → build 一括エラー / dev 警告 | S2・S3・S4 |
| ③ レンダリング中 | ALS Store（既存レール） | 同上 | S1・S1'・S5・S8(dev) |
| ④ レンダリング後 | build ランタイム | 警告 | S9 |

## 3. 検討して不採用にした案

### 3.1 生成後の `dist/` を走査して検出する（不採用）

post-build スキャンなら data-island の取り残し等も一網打尽だが、`09_LINK_SAFETY.md` 3.2 で
post-build スキャンを退けたのと同じ理由（HTML パーサ依存・ソース位置との対応の悪さ・利用者から
魔法に見える）で採用しない。すべてレンダリングの前後で、Cirro が既に持っている情報から検出する。

### 3.2 最初の違反で throw する（不採用）

`09_LINK_SAFETY.md` 4.5 と同じ判断。コンテンツ起因の違反（slug 重複等）は修正→再ビルドの
ループを強いるより全件を一度に報告する方が直しやすい。設定起因（①）だけを fail-loud とする。

### 3.3 `islands` オプションを廃止して `defineRoutes()` に同梱する（不採用）

S1' の「コンフィグのパスと型の由来の断絶」を、content / site と同じ同梱方式で**構造的に**消す案。
理想形ではあるが、島マウンタの仮想モジュールは**バンドル時に静的な import パス**を必要とし
（`load()` が `import islands from "<path>"` を生成する）、routes モジュールの評価（SSR・実行時）
とプラグインの `config` フック（バンドル前）ではタイミングが合わない。構造的解決の代わりに、
**実行時照合（4.3）で断絶を検出する**方針をとる。

### 3.4 props の直列化可能性を型レベルで強制する（不採用・将来候補）

`<Island>` の props 型を `Serializable<ComponentProps<R[K]>>` のような写像型で縛る案。
関数や ReactNode をコンパイル時に弾けるが、複雑な型体操になりエラーメッセージが難読化する。
また島コンポーネント自身の props 型（内部利用では関数を持ってよい）と `<Island>` 経由の
制約を分離する設計判断も必要になる。まずはランタイム検証（4.4）で確実に検出し、型レベルの
強化は将来候補とする（7 章）。

## 4. 採用した設計

### 4.1 ① 設定解決時チェック（即 throw）

`setupCirro` / `configResolved` に追加する。

- **`cssUrl`**: `/` 始まりであること。`//` 始まり・`..` セグメント・空文字を拒否（S6）。
- **`routes` / `islands`**: 指定されたファイルが実在すること。routes は現状でも `runner.import`
  失敗で見つかるが、islands はバンドル時まで遅延するため、早期の実在チェックに意味がある。
- **`watchDir`**: 実在しない場合は**警告**（throw しない。HMR が効かないだけで動作は正しいため、
  エラーに格上げする必要はない）（S7）。

### 4.2 ② ルート展開後チェック（収集 → 一括報告）

`expandRoutes` の直後に検査関数を置き、dev / build で共有する。違反は
`{ type, path, detail }` のレコードとして全件収集し、**build は brokenLinks と同様に
まとめて報告して `process.exitCode = 1`、dev はリクエスト時にコンソール警告**とする。
検査対象は利用者由来のルートのみ（css / fontawesome の合成ルートは内部生成のため対象外）。

- **パス形式**（S4）: 全展開 URL について、`/` 始まり・`//` `\` `..` 制御文字・`?` `#` を
  含まないこと。html ルート（static / dynamic）は `.html` / `.htm` 終端であること。
  file ルートは拡張子を持つこと。動的ルートは `path()` の**戻り値**を検査する
  （params 由来の不正もここで捕まる）。
- **重複検出**（S2）: 展開後の全パスの一意性を検査する。違反レポートには衝突した両方の
  ルート種別と（動的ルートなら）params を含め、slug 重複を特定しやすくする。
- **public 衝突**（S3）: 展開パスと `public/` 配下のファイル一覧の交差を検査する。public の
  列挙は `collectSiteLinks`（`runtime/link.ts`）が既に持っているため、同じ列挙を共有する。
  クリーン URL 側の綴り（`/about` と `public/about`）の衝突も同じ Set 照合で捕まる。

### 4.3 ③ 島の使用収集と照合（S1 / S1' / S8-dev）

本設計の中心。`registry.icon`（`10_IMAGE_ASSETS.md` 5.7 の `registerIcon`）と同型のレールを島にも敷く。

1. **収集**: `Registry` に `island: Set<string>` を追加し、`createIsland()` が返す `Island` は
   レンダリング時に `registerIsland(name)` を呼ぶ（browser 側は no-op。`registry.browser.ts` の
   既存レール）。
2. **照合**: レンダリング後、ランタイムが収集結果を検証する。
   - 島が 1 つでも使われたのに `options.islands` が未設定 → **エラー**（「`cirro({ islands })` を
     設定してください」と解決方法を含める）（S1）。
   - `options.islands` 設定時は、そのモジュールをサーバー側で import（dev / build とも既存の
     Module Runner / 一時 SSR サーバで可能）し、**default export のキー集合**と使用された島名を
     照合する。未知の名前 → ページ path 付きで**エラー**（S1'）。
   - この import の時点で default export の欠落・非オブジェクトも検出できるため、
     **S8 の dev 側（ブラウザコンソールにしか出ない）も同時に解決する**。
3. 報告は brokenLinks と同一レール（dev 警告 / build 一括報告 + 非ゼロ終了）。

これにより「設定パスと型の由来の断絶」（3.3）は、構造的には残るが**実行時に必ず検出される**。

### 4.4 ③ Island props の直列化検証（S5）

判定基準は「**JSON ラウンドトリップで同値に戻るか**」。`createIsland()` の `JSON.stringify(props)`
に replacer を渡し、次を検出して violation として収集する（throw しない。ページ path・島名・
プロパティのキーパス・値の種別を含めて報告）。

- 関数・symbol・bigint・`undefined`（stringify が黙って落とす／落とせない）
- prototype が `Object.prototype` / `Array.prototype` 以外のオブジェクト（`Date`・`Map`・
  React 要素等。stringify で型が変わるか情報が失われる）

replacer は stringify のパスに便乗するため走査の二重コストがなく、検出も網羅的である。
browser 側（島内の入れ子 `<Island>`）は no-op。

### 4.5 ④ `@layer` 宣言漏れの警告（S9）

`stringifyCss` の後（build）に、レジストリの AST から機械的に検査する。

- 収集: `AtBlockRule` のうち prelude が `@layer <名前>` のものからレイヤー名を集める。
- 照合: `AtStatementRule` の `@layer a, b, ...` 宣言に現れない名前を**警告**する
  （`reportGlobalRuleMismatch` と同格。エラーにはしない——宣言なしの初出順に意図的に
  依存する使い方を排除できないため）。
- ネスト名（`@layer a.b`）等の細部は実装時に確定する。

## 5. 制約と非目標

- **検証対象は Cirro の API を通った構成要素のみ**。素の `<a>` / `<img>` を検証しないのと同じ
  契約で、Cirro の与り知らない書き方までは追わない。
- **成果物（`dist/`）の事後走査はしない**（3.1）。
- **`tsc` を通す規約（`04_USAGE.md` 2.2）の強制はしない**。ビルドスクリプトの構成は利用者の
  責任範囲である。
- **スキャフォールディングは本書のスコープ外**。チェック群の導入後、「間違えたら教えてくれる」
  状態を前提に雛形生成（`create-cirro` 等）を別途検討する（`11_TODO.md` 課題 4 後半）。
- S3 の「dev は public 勝ち・build はルート勝ち」は現時点では実装からの推定であり、
  実装時に検証して結果を本書に追記する。

## 6. 実装順序

1. ② ルート展開後チェック（S2・S4・S3）——実装が最も軽く、dev / build 不一致という
   最も気持ち悪い壊れ方を潰せる
2. ③ 島の使用収集と照合（S1・S1'・S8-dev）+ props 直列化検証（S5）
3. ① 設定解決時チェック（S6・S7・ファイル実在）
4. ④ `@layer` 宣言漏れ警告（S9）
5. 調査項目の解消:
   - S10: `react()` と `cirro()` の順序が実際に必要かを検証し、必要なら configResolved で
     順序チェックを追加、不要ならドキュメントの「必ず前に置く」記述を緩和する
   - S3: dev / build の勝者を実測し、本書 5 章に追記する
6. ドキュメント修正: `05_STYLING.md` 7.2 の「書かないと CSS が生成されない」を
   「ビルドがエラーで停止する」に改める（1 章）。`04_USAGE.md` への各チェックの記載

## 7. 将来の拡張候補

- **props の型レベル制約**（3.4）: ランタイム検証の運用実績を見て、`Serializable<T>` 写像型の
  導入を再検討する。
- **スキャフォールディング**: `create-cirro`（`pnpm create cirro`）。`examples/basic` を雛形の
  元にする。チェック群の導入後に着手（5 章）。
- **`routes.ts` 側での islands 同梱**（3.3 の再検討): Vite のプラグイン API 側の進展等で
  バンドル時と実行時のタイミング問題が解けるなら、構造的解決に移行する。

## 付録

### 関連ドキュメント

- `08_CONTENT_LAYER.md` — 「コンフィグのパスと型の由来の断絶」（S1' の問題構造）の原典
- `09_LINK_SAFETY.md` — 収集 → 一括報告レール・post-build スキャン不採用の原典
- `10_IMAGE_ASSETS.md` — `registerIcon`（4.3 が同型に踏襲する収集レール）
- `05_STYLING.md` — 7.2（実装より古い記述の修正対象）・レジストリ AST（4.5 の検査対象）
- `11_TODO.md` — 本書の出発点（課題 4）
