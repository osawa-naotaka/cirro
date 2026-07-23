# スキャフォールディングの設計 - create-cirro

本ドキュメントは、新規サイトの雛形生成（スキャフォールディング）の**設計判断とその理由**を
記録するものである。`11_TODO.md` 課題 4 の後半・`14_CONFIG_VALIDATION.md` がスコープ外とした
部分にあたる。

関連実装: `packages/create-cirro/`（`bin/create-cirro.js` / `src/create.js` / `template/`）。
テスト: `packages/create-cirro/test/create.test.ts`。

---

## 1. 問題設定

Cirro のセットアップには、`registry.ts` + `Island.ts` の定型、`routes.ts` での `runWithRegistry`
再 export、`vite.config.ts` の `react()` + `cirro()` 登録など、手で組む定型が多い。設定ミスは
ビルド時チェック（`14_CONFIG_VALIDATION.md`）が検出するようになったが、そもそも**正しい形から
始められる**方が良い。

## 2. 設計原則

> `pnpm create cirro <dir>` で動く独立パッケージ `create-cirro` として提供し、
> パッケージに同梱したテンプレートを**そのままコピーする**だけの、依存ゼロ・ビルドステップ
> ゼロの薄い CLI とする。

- テンプレートは `examples/basic` を出発点とする（最小構成・島 1 つ・全ルート種別の実例）。
  examples はドッグフーディングでビルド時チェックの検証対象でもあるため、雛形の鮮度が
  自動的に保たれる。

## 3. 検討して不採用にした案

### 3.1 `cirro create` サブコマンド（不採用）

cirro CLI は cirrojs のインストール後にしか使えず、スキャフォールディングは**インストール前**に
必要になる（鶏卵問題）。`pnpm create <name>` は `create-<name>` パッケージを一時取得して実行する
標準の解決策であり、これに乗る。

### 3.2 examples を degit / giget で取得する（不採用）

リポジトリの examples を直接クローンする案。examples はワークスペース前提
（`cirrojs: workspace:*`・ソース解決のための tsconfig 設定）であり、単体では動かない。
テンプレートは「公開された cirrojs に依存する独立プロジェクト」として別に持つ必要がある。

### 3.3 対話式プロンプト・オプション（初期フェーズでは不採用）

島の有無・コンテンツ層の有無などを選ばせる案。選択肢はテンプレートの組み合わせ爆発を招く。
初期フェーズは**単一テンプレート**とし、不要な部分は生成後に消してもらう（最小構成なので
消す量も小さい）。プロンプトライブラリへの依存も避けられる。

### 3.4 TypeScript + ビルドステップで CLI を書く（不採用）

CLI は 100 行未満のファイルコピーであり、tsdown 等のビルド構成を持ち込む価値がない。
プレーンな Node ESM（.js）で書き、依存ゼロを保つ。

## 4. 採用した設計

### 4.1 パッケージ構成

```
packages/create-cirro/
├─ package.json          # bin: create-cirro / files: bin, src, template
├─ bin/create-cirro.js   # 引数処理と案内表示
├─ src/create.js         # コピー処理の本体（テスト対象）
└─ template/             # 雛形（examples/basic 由来）
   ├─ _package.json      # → package.json（{{PROJECT_NAME}} を置換）
   ├─ _gitignore         # → .gitignore
   ├─ tsconfig.json      # スタンドアロン用（ワークスペース固有設定なし）
   ├─ vite.config.ts
   └─ src/               # routes / pages / islands / components / styles（examples/basic と同型）
      ├─ styles.ts       # トークン・css ヘルパー・レイアウト・レシピを 1 ファイルにまとめたもの
      └─ components/     # 全ページ共通のシェル（Layout.tsx）
```

- **`src/` は `examples/basic/src/` とバイト単位で同一に保つ**。examples を直すとテンプレートも直る、
  という 2 節の狙いを実際に成立させるための規律であり、片方だけを編集しない。差が出てよいのは
  `tsconfig.json` と `_package.json` だけで、理由は次の 2 つ。
  - examples はワークスペースのソース（`.ts`）を直接解決するため `allowImportingTsExtensions` を持つ。
  - テンプレートは `@types/node` を devDependency に持ち、`types` に `"node"` を加える。`Layout.tsx` が
    CSP meta の出し分けで `process.env.CIRRO_COMMAND` を読むため（`04_USAGE.md` 9.1）。examples 側は
    ワークスペースの cirrojs ソース経由で node の型が入るので明示していない。
- 雛形は無スタイルではなく、`05_STYLING.md` の作法（トークン → css ヘルパー → レイアウト
  プリミティブ → レシピの 3 層）に沿った最小のデザインシステムを同梱する。生成直後から見栄えのする
  ページが出ることに加えて、スタイルの書き方の実例を兼ねる。

- **`_` プレフィックス規約**: npm publish は同梱物の `package.json` を特別扱いし
  `.gitignore` を除外するため、`_package.json` / `_gitignore` として持ち、コピー時に
  リネームする（create-* パッケージの一般的な慣例）。
- テンプレートの `cirrojs` 依存は公開バージョンのキャレット指定。**cirrojs のリリース時に
  テンプレートのバージョンも更新する**（リリース準備手順に追加する）。

### 4.2 CLI の挙動

```
pnpm create cirro my-site
```

1. 引数（ディレクトリ）必須。無ければ使い方を表示して非ゼロ終了。
2. プロジェクト名はディレクトリの basename。npm の命名規則（小文字英数と `-._`）で検証する。
3. 対象ディレクトリが存在して空でなければエラー（上書きしない）。
4. テンプレートをコピーし、`_package.json` → `package.json`（`{{PROJECT_NAME}}` 置換）、
   `_gitignore` → `.gitignore` にリネームする。
5. 次の手順（`cd` → `pnpm install` → `pnpm dev`）を表示する。

## 5. 制約と非目標

- **パッケージマネージャは pnpm を前提**とした案内を出す（Cirro 本体の前提と同じ）。
- **git init はしない**（利用者の管理領域）。
- **テンプレートは 1 種類**（3.3）。
- cirrojs 本体と別パッケージのため、**リリース・公開は個別**になる。

## 6. 将来の拡張候補

- テンプレートへの `defineSite` + sitemap / RSS / OGP の組み込み（コメントアウトの形で提示する等）。
- blog テンプレートの追加（コンテンツ層 + Markdown。テンプレートが 2 つに増えたら
  引数 `--template blog` を導入する）。
- リリース自動化（cirrojs のバージョンアップとテンプレートの依存更新の連動）。

## 付録

### 関連ドキュメント

- `04_USAGE.md` — 雛形が従うセットアップ規約の原典
- `14_CONFIG_VALIDATION.md` — 本書と対になるビルド時チェック（課題 4 の前半）
- `11_TODO.md` — 本書の出発点（課題 4）
