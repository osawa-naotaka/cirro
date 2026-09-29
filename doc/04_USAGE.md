# Cirro 利用ガイド

本ドキュメントは Cirro の **使い方を一通り通す実践ガイド**である。新規サイトの雛形生成から、
ルーティング・ページ・島・コンテンツ層・Markdown・スタイリング・リンク/画像・SEO・ビルド時
チェック・CSP・デプロイまでを、**このガイド一冊でサイト構築からデプロイまで通せる**ことを狙って
まとめている。

- **なぜ**この設計なのか（背景・目的・検討して不採用にした案）は各設計ドキュメントを参照する。
  本書は各所で理由を 1〜2 行に圧縮し、深掘りは該当 doc へリンクする。
- 題材は `examples/basic`（最小構成）と `examples/blog`（Markdown + 自前 CSS の実運用例）の実コードに即す。
  `create-cirro` の雛形は `examples/basic` と同型である。

| 章 | 内容 |
| --- | --- |
| 1〜3 | 前提・クイックスタート・プロジェクト構成と設定 |
| 4〜8 | ルーティング・ページ・島・コンテンツ層・Markdown |
| 9 | スタイリング（自前 CSS 生成の実用要点。網羅は `05_STYLING.md`） |
| 10〜11 | 安全な参照（リンク・画像）・サイトメタデータ（SEO） |
| 12〜14 | ビルド時チェック・CSP・デプロイ |
| 15 | dev / build の内部（読み飛ばし可） |

---

## 1. はじめに / 前提

### 1.1 Cirro とは

Cirro は、React の島（islands）アーキテクチャで **インラインスクリプトを一切生成せず、`script-src 'self'`
の厳格な CSP を満たす**静的サイト（MPA）を生成する軽量 SSG である。本文はビルド時に純粋な静的 HTML 化され、
インタラクティブな「島」だけがクライアントでハイドレートされる。props はインラインスクリプトではなく
`data-*` 属性で渡すため、`unsafe-inline` なしの CSP が成立する（背景と目的は `01_CHARTER.md`）。

### 1.2 前提パッケージ

Cirro は次を **peer dependency** として要求する（利用者の `package.json` に入れる）。

| パッケージ | 役割 |
| --- | --- |
| `react` / `react-dom` | v19 系。サーバーレンダリングとハイドレーション |
| `vite` | v8 系。ビルド基盤 |
| `@vitejs/plugin-react` | React 変換（Cirro は内包しない。利用者が明示的に追加する） |

パッケージ管理は **pnpm** を前提とする（`pnpm install` / `pnpm run` / `pnpm create`）。

### 1.3 このガイドの読み方

本書は「どう書くか」に徹する。設計判断の理由は各設計ドキュメント（`06`〜`14`, `16` 等）に集約している。
急ぐなら **2 章のクイックスタート**で雛形を作り、動かしながら 4 章以降を必要に応じて読めばよい。

---

## 2. クイックスタート

### 2.1 雛形を生成する

`create-cirro` で、正しい形（`registry.ts` + `Island.ts` の定型、`routes.ts` の `runWithRegistry`
再 export、`vite.config.ts` の `react()` + `cirro()` 登録、最小のデザインシステム）が揃った雛形を生成する。

```sh
pnpm create cirro my-site
cd my-site
pnpm install
pnpm dev
```

- 引数はプロジェクトディレクトリ名（必須）。プロジェクト名は basename から取り、npm の命名規則で検証される。
- 対象ディレクトリが存在して空でなければエラー（上書きしない）。git init は行わない。
- 雛形は 1 種類（最小構成）。不要な部分は生成後に消す。設計判断は `16_SCAFFOLDING.md`。

### 2.2 生成されるディレクトリ構成

`examples/basic` と同型（`src/` はバイト単位で同一に保たれている）。

```
my-site/
├─ package.json           # dev / build / preview スクリプト
├─ tsconfig.json
├─ vite.config.ts         # react() + cirro() を登録
└─ src/
   ├─ routes.ts           # サイトのルート定義（Config Base Routing）
   ├─ styles.ts           # トークン・css ヘルパー・レイアウト・レシピを 1 ファイルに
   ├─ components/
   │  └─ Layout.tsx       # 全ページ共通のシェル（<head>・ナビ・フッター）
   ├─ pages/              # 各ルートのページコンポーネント（home / about / post）
   └─ islands/
      ├─ registry.ts      # 島の対応表（純データ・default export）
      ├─ Island.ts        # createIsland(islands) で型付き <Island> を生成
      └─ Counter.tsx      # 島コンポーネント
```

雛形は無スタイルではなく、`05_STYLING.md` の作法（トークン → css ヘルパー → レイアウトプリミティブ →
レシピ）に沿った最小のデザインシステムを同梱する。生成直後から見栄えのするページが出て、書き方の実例も兼ねる。

### 2.3 dev / build / preview を回す

```sh
pnpm dev      # 開発サーバー（SSR + ルーティング + HMR）。既定 http://localhost:5173
pnpm build    # 本番ビルド（tsc → cirro build）。dist/ に静的サイトを書き出す
pnpm preview  # 生成物の確認（vite preview）
```

これで最初の「動くもの」が確認できる。以降の章で、ルート・ページ・島・スタイルの書き方を見ていく。

---

## 3. プロジェクト構成と設定

雛形を使わず手で組む場合、または雛形の設定を理解したい場合の詳細。

### 3.1 package.json のスクリプト規約

```jsonc
{
    "type": "module",
    "scripts": {
        "dev": "cirro dev",
        "build": "tsc && cirro build",
        "preview": "vite preview"
    }
}
```

- `dev` … `cirro dev`（dev サーバー）。
- `build` … **`tsc` を先に通してから** `cirro build`。型エラーを含んだまま静的 HTML を生成しないための作法
  （この規約自体は強制しない。ビルドスクリプトの構成は利用者の責任）。
- `preview` … ビルド結果の確認は Vite 標準の `vite preview` を使う（Cirro 独自コマンドではない）。

### 3.2 tsconfig.json

`examples/basic` の要点。

```jsonc
{
    "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "bundler",
        "jsx": "react-jsx",
        "strict": true,
        "verbatimModuleSyntax": true,
        "lib": ["ESNext", "DOM", "DOM.Iterable"],
        "types": ["vite/client", "node"]
    },
    "include": ["src", "vite.config.ts"]
}
```

- `types` に `"node"` を含めるのは、`process.env.CIRRO_COMMAND`（13.2 の CSP meta 出し分け）を読むため。
  この場合 `@types/node` を devDependency に入れる。

### 3.3 vite.config.ts

Cirro の本体は 1 つの Vite プラグイン `cirro()` として提供される。`vite.config.ts` に登録する。

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { cirro } from "cirrojs/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        react(), // ← 慣例として cirro() より前に置く
        cirro({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" }),
    ],
});
```

Cirro は `@vitejs/plugin-react` を**内包しない**（利用者が明示的に追加する）。
登録順は実測上どちらでも動作する（cirro は JSX 変換を行わないため順序依存がない）が、慣例として
`react()` を先に書くことを推奨する（`14_CONFIG_VALIDATION.md` S10）。

### 3.4 CirroOptions

| オプション | 必須 | 既定値 | 意味 |
| --- | --- | --- | --- |
| `routes` | ✓ | — | ルート定義ファイル（`routes` を default export する `.ts`）への相対パス |
| `islands` | — | — | 島レジストリ（島を default export する `.ts`）への相対パス |
| `cssUrl` | — | `/assets/styles.css` | build でマージ出力する CSS の URL（`/` 始まり必須。`/assets` の外へ出す等に使う） |
| `watchDir` | — | `./src` | dev サーバーが full-reload の対象として監視するディレクトリ |

- `cssUrl` は `/` 始まりでないなどの形式違反を設定解決時に即エラーにする（12 章）。
- `watchDir` が実在しない場合は警告のみ（HMR が効かないだけで動作は正しいため）。

### 3.5 CLI

Cirro の CLI は `cirro <dev|build>` の 2 コマンドのみ。

| コマンド | 役割 |
| --- | --- |
| `cirro dev` | dev サーバーを起動（SSR + ルーティング + HMR）。既定 `http://localhost:5173` |
| `cirro build` | 静的サイトを生成し `dist/` に書き出す |

プレビューは CLI ではなく **`vite preview`** を使う。

### 3.6 プラグインが裏で行うこと

`cirro()` は `config()` フックで、CSP 厳格化のためのビルド設定を自動注入する（利用者は書かない）。

- `assetsInlineLimit: 0` … 小さなアセットを data URI でインライン化しない。
- `modulePreload.polyfill: false` … モジュールプリロードの polyfill（インラインスクリプト）を無効化。
  Astro が解決できなかった「ごくわずかなインライン」はこのバンドラ由来であり、ここで封じる。
- `manifest: true` … ビルド成果物のファイル名対応表を出力（build が島用 JS / CSS のパスを引くのに使う）。
- `rollupOptions.input.client` … 島マウンタ（仮想モジュール `virtual:cirro/client`）を単一エントリに指定。

詳細は `02_CLIENT_SCRIPT_BUNDLING.md` と `03_ISLAND_SYSTEM.md`。

---

## 4. ルーティング（Config Base Routing）

ファイルベースルーティングは採用せず、`routes.ts` に **型付きの JavaScript オブジェクト**として
ルートを宣言する。正規表現や独自の文字列記法は使わない（型と関数で表現する方針）。

### 4.1 createRouteFn / defineRoutes / route

ルートビルダーは `createRouteFn()` ファクトリから取得する。`route()` にルート定義オブジェクトを渡して
宣言し、`defineRoutes()` で束ねて default export する。

```ts
// src/routes.ts
import { createRouteFn } from "cirrojs";
import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { generateSearchIndex } from "./pages/search-index";

// 自前 CSS のレジストリ関数を再 export する（必須・4.4 参照）
export { runWithRegistry } from "cirrojs";

// コンテンツ層やサイトメタデータを使う場合は createRouteFn({ content, site }) と渡す（7 章・11 章）
const { defineRoutes, route } = createRouteFn();

export default defineRoutes(
    // 静的ルート: path は固定文字列
    route({ type: "static", path: "/index.html", component: HomePage }),
    route({ type: "static", path: "/about.html", component: AboutPage }),

    // 動的ルート: path は params から URL を生成する関数
    route({
        type: "dynamic",
        path: ({ slug }) => `/posts/${slug}.html`,               // params から URL を生成
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }], // 生成する全 params
        component: PostPage,
    }),

    // ファイルルート: 任意のテキストファイルを生成出力する
    route({
        type: "file",
        path: "/search-index.json", // 拡張子まで含む出力パス
        component: generateSearchIndex,
    }),
);
```

### 4.2 3 種類のルート

- **静的ルート** `{ type: "static", path, component }` … `path` は固定文字列（`.html` / `.htm` 終端）。
  `component` は React 要素を返す。
- **動的ルート** `{ type: "dynamic", path, getStaticPaths, component }` … `getStaticPaths()` が返す
  各 params を `path()` 関数に通して URL を生成する。`component` は React 要素を返す。
- **ファイルルート** `{ type: "file", path, component }` … 任意のテキストファイルを生成出力する。
  `component` は **React 要素ではなく文字列を返す**関数で、その文字列が `path`（拡張子まで含む固定パス）へ
  そのまま書き出される。検索インデックス（`/search-index.json`）・sitemap・RSS の生成に使う（11 章）。

CSS の URL をルート定義に書く必要はない。ルート単位の CSS はレンダリング結果から自動生成され、
`<link>` もランタイムが自動挿入する（5.4 と 9.3）。

### 4.3 getStaticPaths

動的ルートの全 URL は `getStaticPaths()` が返す params から決まる。コンテンツ層を使う場合、
`getStaticPaths` は引数に `content` を受け取り、取得済みデータから params を作れる（7 章）。

```ts
getStaticPaths: (content) => content.posts.map(({ slug }) => ({ slug })),
```

### 4.4 runWithRegistry の再 export【必須】

自前 CSS のレジストリは `AsyncLocalStorage` のインスタンス（モジュールスコープの状態）に紐付く。
ランタイムは**ルート定義モジュール（`routes.ts`）から import した `runWithRegistry`** で描画を包むため、
`toStyle()` 側と**同一モジュールインスタンス**を共有させる必要がある。利用側の `routes.ts` で
`runWithRegistry` を**再 export する必要がある**（理由は 9.3 / `05_STYLING.md` 7.2）。

```ts
// src/routes.ts の先頭付近
export { runWithRegistry } from "cirrojs";
```

これを書き忘れるとビルドがエラーで停止する（`setup.ts` が検出して知らせる）。

---

## 5. ページとレイアウト

### 5.1 ページコンポーネント

ページは `<html>` 全体を返す React コンポーネント。`<head>` は手書きする。props は `{ params, content }`
（動的ルートの `params` と、コンテンツ層の `content`。7 章）。使わない prop は受け取らなくてよい。

```tsx
// src/pages/post.tsx
import { Island } from "../islands/Island";

export function PostPage({ params }: { params: { slug: string } }) {
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{`post: ${params.slug}`}</title>
            </head>
            <body>
                <h1>{`Post: ${params.slug}`}</h1>
                <Island name="counter" props={{ initial: 1 }} />
            </body>
        </html>
    );
}
```

### 5.2 PageProps による型付け

コンテンツ層・動的ルートを使う場合、`PageProps` でページ props を型付けする。第 1 型引数はコンテンツ
ハンドルの型、第 2 型引数は動的ルートの params（7 章に詳細）。

```tsx
import type { PageProps } from "cirrojs";
import type { content } from "../content";

export function PostPage(props: PageProps<typeof content, { slug: string }>) {
    const post = props.content.posts.find((p) => p.slug === props.params.slug);
    // ...
}
```

### 5.3 レイアウトの共通化

`<html>` シェルを毎ページ書くのは冗長なので、共通の `Layout` コンポーネントに切り出すとよい
（`examples/blog` の `src/components/Layout.tsx`）。ナビ・フッター・`<head>` をまとめ、本文を `children`
で受け取る。`island` のような prop でページ単位に島の有無を切り替えられる。

```tsx
type LayoutProps = { title: string; description?: string; children: ReactNode; island?: boolean };

export function Layout({ title, description, children, island = true }: LayoutProps) {
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <title>{title}</title>
                {description ? <meta name="description" content={description} /> : null}
                {/* CSS の <link> はランタイムが自動挿入する（5.4）。手書きしない */}
            </head>
            <body>
                <main>{children}</main>
                {island ? <Island name="scrollTop" props={{}} /> : null}
            </body>
        </html>
    );
}
```

### 5.4 クライアントスクリプトと CSS の自動挿入

**利用者は `<script>` も CSS の `<link>` も書かない**。Cirro が島マウンタ（`virtual:cirro/client`）への
`<script async type="module">` と、ルート CSS への `<link rel="stylesheet">` を、レンダリングしたツリーに
併置して挿入する。React 19 のメタデータ巻き上げ（hoisting）により、これらはツリーのどこに置かれても
`<head>` へ自動で巻き上げられる。文字列置換を行わず、インラインスクリプトも生成しないため、
`script-src 'self'` を維持する。

---

## 6. 島（islands）システム

> 仕組みの詳細（`hydrateRoot`、`data-*` 受け渡し、仮想モジュール、型安全性）は `03_ISLAND_SYSTEM.md` に
> 集約している。ここでは使い方の要点のみ示す。

### 6.1 島を使う 3 ステップ

1. **島コンポーネントを書く**（`src/islands/Counter.tsx`）— ふつうの React コンポーネント。
   クライアントで動くので `useState` 等を自由に使える。

   ```tsx
   import { useState } from "react";

   export function Counter({ initial = 0 }: { initial?: number }) {
       const [count, setCount] = useState(initial);
       return (
           <button type="button" onClick={() => setCount((c) => c + 1)}>
               count: {count}
           </button>
       );
   }
   ```

2. **レジストリに登録**（`src/islands/registry.ts`）— 純データの対応表を **default export** する
   （cirro は default export を探す）。`as const` を付けて名前をリテラル union に絞る。

   ```ts
   import { Counter } from "./Counter";
   export default { counter: Counter } as const;
   ```

3. **型付き `<Island>` を生成**（`src/islands/Island.ts`）— 定型の 3 行。

   ```ts
   import { createIsland } from "cirrojs/server";
   import islands from "./registry";
   export const Island = createIsland(islands);
   ```

> `registry.ts`（純データ・サーバー/クライアント両方が import）と `Island.ts`（`createIsland` を通じて
> サーバー専用）を分けるのは、クライアントバンドルに `renderToString` 等のサーバー専用コードを混入させない
> ための設計上の制約である（`03_ISLAND_SYSTEM.md` 2.5）。

### 6.2 ページでの使い方

```tsx
<Island name="counter" props={{ initial: 3 }} />
```

`name` はレジストリのキー、`props` はその島へ渡す値。`name` が registry に無い名前だったり、`props` の型が
島の引数と合わなければ **TypeScript がコンパイル時にエラーにする**。

### 6.3 クライアント JS は全ページ共有の単一バンドル（設計）

全ページが、島マウンタと全島のコードを束ねた**同一の JS ファイル**を読み込む（島を使わないページも同じ）。
これは制限ではなく設計判断で、ページ単位の JS 分割はスコープ外とした（背景は `01_CHARTER.md` 2.3。要約:
対象領域では JS が小さい・MPA では共有 1 ファイルがページ間でキャッシュされ 2 ページ目以降の転送がゼロ・
実サイトではヘッダー島により島ゼロページは稀）。

**トレードオフと逃げ道**: 特定ページでしか使わない重い島（チャート描画ライブラリ等）を registry に登録すると
全ページの初回ロードが重くなる。重い部分は島の内部で `React.lazy` + dynamic import に切り出す。Rollup が
動的 import を自動で別チャンクに分割し、実際に必要になったときだけ取得される（分割チャンクは共有バンドルに
含まれず、`<script>` は 1 本のまま、`script-src 'self'` も維持される）。

```tsx
// 島の内部で重い部分を遅延させる（島そのものは registry に通常どおり登録する）
import { lazy, Suspense, useState } from "react";

const HeavyChart = lazy(() => import("./HeavyChart"));

export function ChartIsland() {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <button type="button" onClick={() => setOpen(true)}>show chart</button>
            {open && (
                <Suspense fallback={<p>loading...</p>}>
                    <HeavyChart />
                </Suspense>
            )}
        </div>
    );
}
```

### 6.4 制約

- **hydration mismatch を避ける**: 島のレンダリング結果がサーバーとクライアントで一致している必要がある。
  `Date.now()` / `Math.random()` / `typeof window` 分岐などを島の初期レンダリングに使うとズレる。
- **props は JSON シリアライズ可能であること**: `data-props` は `JSON.stringify` / `JSON.parse` を通る。
  関数・クラスインスタンス・`Date`・ReactNode などはそのまま渡せない（渡すとビルド時チェックが検出する。12 章）。
- **島のスタイルは初期 SSR 描画で全て登録すること**: 自前 CSS は SSR 描画で実際に実行された分だけ生成される。
  遅延マウントされる部分は `styleSample()` でサンプルを登録する等で回避する（9.6 と `05_STYLING.md` 7.3）。

---

## 7. コンテンツ層（defineContent）

ページの描画は `renderToStaticMarkup` による同期処理のため、コンポーネント内で `await` はできない。
DB・CMS・ファイルシステムなどからの非同期なコンテンツ取得は、レンダリングより前に済ませる必要がある。
この「取得（非同期）と描画（同期）の分離」を担うのがコンテンツ層である（設計背景は `08_CONTENT_LAYER.md`）。

### 7.1 loader と createRouteFn({ content })

`defineContent()` に async な `loader` を渡してハンドルを作り、`createRouteFn({ content })` に渡す。

```ts
// src/content.ts
import { defineContent } from "cirrojs";

export const content = defineContent({
    loader: async () => {
        const posts = await fetchPosts(); // glob でもフェッチでも手書きオブジェクトでもよい
        return { posts };
    },
});
```

```ts
// src/routes.ts
import { createRouteFn } from "cirrojs";
import { content } from "./content";

const { defineRoutes, route } = createRouteFn({ content });

export default defineRoutes(
    route({
        type: "dynamic",
        path: ({ slug }) => `/blog/${slug}.html`,
        getStaticPaths: (content) => content.posts.map(({ slug }) => ({ slug })),
        component: PostPage,
    }),
    // ...
);
```

ランタイムはレンダリング前に `loader()` を一度だけ await し、結果を `getStaticPaths` の引数と全ルート
コンポーネント（ファイルルート含む）の `content` prop へ配る。`loader` の戻り値の型は
`createRouteFn({ content })` を通じて `getStaticPaths` と `component` の型チェックに伝播する。
コンテンツ層と同時にサイトメタデータも使うなら `createRouteFn({ content, site })`（11 章）。

### 7.2 ページでの受け取り

ページ側は `PageProps` で型付けする（5.2）。第 2 型引数は動的ルートの params。

```tsx
export function PostPage(props: PageProps<typeof content, { slug: string }>) {
    const post = props.content.posts.find((p) => p.slug === props.params.slug);
    // ...
}
```

### 7.3 実行タイミングとキャッシュ

- **build**: 生成開始前に 1 回だけ実行。
- **dev**: 初回リクエストで実行して結果をキャッシュし、`watchDir`（既定 `./src`）配下のファイルの
  変更・追加・削除でキャッシュを破棄して次のリクエストで再実行する。
- **出自は問わない**: loader が返すものがコンテンツである。glob で読んだ Markdown（8.3）、ネットワーク越しの
  フェッチ結果、手書きの JavaScript オブジェクトを 1 つのストアに合成してよい。
- **コンテンツはビルド時専用**: `content` はサーバー側（SSR）にのみ存在し、島（クライアント）からは
  参照できない。島に渡したいデータは `<Island>` の props として明示的に渡す。
- コンテンツ層を使わないサイトは `createRouteFn()` を引数なしで呼ぶ（`examples/basic`）。

---

## 8. Markdown コンテンツ

Cirro は `createMarkdownProcessor()` ファクトリで Markdown 描画 API を提供する。変換はビルド時（SSR）に
同期実行され、結果は静的 HTML として埋め込まれる。**unified 一式の JS はクライアントへ送られない**。

### 8.1 パイプラインの構築

サイト側で一度だけ設定済みの描画関数を作る（`examples/blog` の `src/lib/markdown.ts`）。

```ts
import { createMarkdownProcessor } from "cirrojs/server";
import remarkGfm from "remark-gfm";

export const { render: renderMarkdown } = createMarkdownProcessor({
    remarkPlugins: [remarkGfm], // GFM（テーブル・打消し線・タスクリスト等）
    toc: true,                  // 見出しへのシリアル id 付与 + 目次抽出
    highlight: true,            // rehype-prism によるクラスベースのシンタックスハイライト
});
```

設定できる主な項目（`MarkdownConfig`）:

| オプション | 意味 |
| --- | --- |
| `remarkPlugins` / `rehypePlugins` | サニタイズ**より前**に走るユーザープラグイン層 |
| `sanitizeSchema` | 既定スキーマを受け取り拡張して返す（サニタイズ自体は無効化できない） |
| `toc` | 目次抽出の有効化（`{ prefix, startLevel }` で調整可） |
| `highlight` | `rehype-prism` によるハイライト。インラインスタイルを生成せずクラスで色付け |
| `checkRefs` | 本文中の `a href` / `img src` のビルド時検証（**既定 true**。8.5 参照） |

### 8.2 サニタイズは固定で強制される

パイプラインは **ユーザープラグイン層 → `rehype-sanitize`（固定の防衛線）→ 信頼済み層（ハイライト・
参照検証等）** の二層構造。ユーザーが上流で何を生成しても、必ず許可リストのサブセットだけが通る。
`allowDangerousHtml` を渡さないため raw HTML も通らない。サニタイズを無効化する手段はあえて提供していない
（CMS 等の信頼できない入力も想定した脅威モデル）。戻り値は型レベルで「サニタイズ済み HTML」に限定される。

### 8.3 frontmatter とコンテンツの読み込み

記事メタデータは frontmatter で持ち、`gray-matter` 等でパースする。読み込みとパースはコンテンツ層（7 章）の
loader 内で行う。Markdown ファイルは Vite の `import.meta.glob`（`?raw` + `eager`）でビルド時に文字列として
読み込む（`examples/blog` の `src/content.ts`）。

```ts
import { defineContent } from "cirrojs";
import matter from "gray-matter";

export const content = defineContent({
    loader: async () => {
        const files = import.meta.glob("./content/posts/*.md", {
            query: "?raw", import: "default", eager: true,
        }) as Record<string, string>;

        const posts = Object.entries(files).map(([path, raw]) => {
            const { data, content } = matter(raw); // data = frontmatter, content = 本文 Markdown
            return { /* slug, title, date, tags, ... */ content };
        });
        return { posts };
    },
});
```

### 8.4 ページでの描画

`render()` は本文（`body`）と目次（`toc`）を 1 パスで返す。`body` はそのままマウントできる React 要素。

```tsx
const { body, toc } = renderMarkdown(post.content, { className: article });

return (
    <article>
        <TableOfContents toc={toc} />
        {body}
    </article>
);
```

`className` に渡したクラスで本文コンテナを装飾できる（見出し・コードブロック・Prism トークン配色などは
子孫セレクタでスタイルする。9 章）。プレーンテキスト化が必要なら `markdownToText`（`cirrojs/server`）も使える。

### 8.5 本文中のリンク・画像の検証（checkRefs）

Markdown 本文中の `a href` と `img src` は、`<Link>` / `<Image>` と同じレールで**ビルド時に検証される**
（既定オン。設計は `13_MARKDOWN_REF_CHECK.md`）。

| 参照の形 | 扱い |
| --- | --- |
| `/about` などルート相対 | サイトの URL 集合（全ルート + `public/`）と照合。無ければ not-found |
| `#section` アンカー | 素通し |
| `https://...` 等スキーム付き | 素通し（外部リンク・外部画像。死活確認はしない） |
| `./foo` 等の相対パス・`//host` | malformed（コンテンツの置き場所と URL 構造は独立のため、相対は書けない） |

- 違反は dev ではコンソール警告、`cirro build` ではページ path 付きでまとめて報告して非ゼロ終了。
- 検証はページ描画時に行われる。loader 内での事前レンダリングでは検証されない。
- `checkRefs: false` で無効化できる（ルート表にない同一ドメイン URL へ意図的にリンクする場合の逃げ道は、
  自サイトの絶対 URL をベタ書きすること。スキーム付きなので素通しになる）。
- 外部画像は推奨 CSP（`default-src 'self'`）ではブロックされるため、使う場合は `img-src` を緩める必要がある。

---

## 9. スタイリング（自前 CSS 生成）

Cirro は自前実装の CSS 生成 API を持つ。**ランタイムにスタイルを注入せず**（`<style>` も `style=""` も
出さない）、**ルート単位に 1 個の外部 CSS を生成**して `<link>` で配信する。これにより
`style-src 'self'` まで満たす厳格 CSP を維持する。

> 本章は実際にサイトを書ける要点に絞る。ネストルール・キーフレームの詳細・完全な API リファレンス・
> 設計の理論的背景は `05_STYLING.md`、レスポンシブ運用規約は `07_RESPONSIVE_STYLING.md` を参照。

### 9.1 基本 — ss / toStyle と css 関数

`ss()` でスタイルルール（宣言ブロック）を作り、`toStyle()` に渡すとレジストリへ登録され、**クラス名が
文字列で返る**。返ったクラス名を `className` に渡すだけでよい。

```tsx
import { ss, toStyle } from "cirrojs";

export function HomePage() {
    const title = toStyle(ss({ padding: "1rem", font_size: "2rem", color: "#222" }));
    return <h1 className={title}>cirro</h1>;
}
```

- プロパティ名は **JS 識別子として書けるようアンダースコア区切り**（`font_size` → `font-size`）。
  `--` 始まりのキーはカスタムプロパティとしてそのまま出力。型（`Properties`）で補完・型チェックが効く。
- 戻り値は `cirro-<hash>` 形式のクラス名。ハッシュはルールノードのツリー全体から決まる決定的ハッシュなので、
  同じ内容なら常に同じクラス名になり、重複は自然に排除される。

毎回 `toStyle(ss(...))` と書くのは冗長なので、通常のコンポーネントスタイルは `genCssFn()` で
**アットルール（レイヤー・メディアクエリ）を固定した専用関数（css 関数）**を作って使う。

```tsx
import { at, genCssFn } from "cirrojs";

// 「@layer main」用の css 関数
const cssMain = genCssFn((inject) => at("@layer main", inject()));
// 「@layer main かつ PC幅」用
const cssPc = genCssFn((inject) => at("@layer main", at("@media (min-width: 900px)", inject())));

const pageTitle = cssPc({ padding: "1rem", font_size: "2rem" });
```

セレクタは `ss()` / css 関数の第 2 引数 `{ selector }` で指定する（既定 `"$"` = 自クラス参照）。
`$` は生成クラス自身に置換され、`"$:hover"` や `"$ h2"`（Markdown 本文などへの子孫指定）を書ける。

### 9.2 カスケードレイヤーとリセット CSS

明示的なカスケードレイヤーの宣言を推奨する。`defineCascadeLayer()` で優先順位を固定する。

```ts
import { defineCascadeLayer, resetCss } from "cirrojs/layout";

defineCascadeLayer();  // 既定 "base, font, low, main, high"（右ほど高優先）
resetCss();            // 標準リセット CSS を @layer base に登録
```

| レイヤー | 想定用途 |
| --- | --- |
| `base` | リセット CSS・要素デフォルト |
| `font` | フォント関連 |
| `low` | レイアウトプリミティブ（`createLayout` の既定出力先） |
| `main` | 通常のコンポーネントスタイル（`cssMain` 等で明示） |
| `high` | 最優先で上書きしたいスタイル |

### 9.3 ルート単位の CSS 生成と runWithRegistry

`toStyle()`（および css 関数）は呼ばれるたびにスタイルをレジストリへ積む。レジストリは
`AsyncLocalStorage` で管理され、レンダリング 1 回ごとに専用のレジストリが割り当てられる（別ルートの
スタイル登録が混ざらない）。ランタイムは各ルートの描画を `runWithRegistry()` で包み、収集したスタイルを
CSS 文字列にして書き出す。

- dev … ルートの HTML パスに `.css` を付けた URL でそのルート分の CSS を配信。
- build … 全ルート分をマージした 1 つの CSS（既定 `/assets/styles.css`。`cssUrl` で変更可）を書き出す。

どちらも `<link rel="stylesheet">` はランタイムが自動挿入する（5.4）。**スタイル登録は必ず描画時に呼ぶ**
（モジュールのトップレベルで `const x = toStyle(...)` とすると描画コンテキスト外となり例外）。

そしてこの `AsyncLocalStorage` を共有させるため、**`routes.ts` で `runWithRegistry` を再 export する必要が
ある**（4.4 で述べたとおり。書き忘れるとビルドが停止する）。

### 9.4 レイアウトプリミティブ（createLayout）

"Every Layout" の「意図で名付けたレイアウト語彙」（Stack / Cluster / Center …）を型付き関数として提供する。
サブパス `cirrojs/layout` から `createLayout()` でサイトの既定値を束縛して使う。値はすべて単位付き文字列。

```ts
// src/styles/layout.ts — サイトの既定値で束縛して re-export
import { createLayout } from "cirrojs/layout";

export const { stack, cluster, center, grid, switcher, sidebar } = createLayout({
    defaults: { gap: "1rem", centerMax: "56rem" },
});
```

```tsx
import { center, stack, cluster } from "../styles/layout";

<main className={center({ gutters: "1rem" })}>   {/* 中央寄せ・最大幅は既定 */}
    <div className={stack({ gap: "1.5rem" })}>…</div>   {/* 縦積み */}
    <div className={cluster({ gap: "0.5rem" })}>…</div> {/* 折返し横並び */}
</main>
```

- 単一クラスを返すプリミティブ（`stack` / `cluster` / `center` / `grid` / `switcher` / `frame` / `reel` /
  `imposter` / `box`）には `<div>` を返す PascalCase のコンポーネント版（`Stack` / `Cluster` / …）もある。
  純レイアウト目的はコンポーネント、セマンティック要素（`ul` / `nav` 等）は小文字の関数で `className` を当てる。
- `sidebar` / `cover` は子ごとにスタイルが違うため**クラス名の束**（`{ root, side, content }` 等）を返す。
- クラス名の結合には `cx()`（falsy を除外して空白結合）を `cirrojs/layout` から使う。

全 11 プリミティブの引数・既定値・生成 CSS 例は `05_STYLING.md` 10 章。

### 9.5 レスポンシブ

PC / スマホでデザインを変える場合、「可視性」と「ブレークポイント別スタイル」を分離する規約を推奨する
（背景は `07_RESPONSIVE_STYLING.md`、確定仕様は `05_STYLING.md` 5.1）。サイト側に次を 1 組だけ置く。

```ts
// styles/system.ts
export const hideOnPc = (): string => cssPc({ display: "none" });    // = スマホ専用
export const hideOnPhone = (): string => cssPh({ display: "none" }); // = PC 専用

export function responsive({ base, pc, phone }: {
    base?: Properties; pc?: Properties; phone?: Properties;
}): string {
    return cx(base && cssMain(base), pc && cssPc(pc), phone && cssPh(phone));
}
```

- **可視性は意図名ヘルパー**（`hideOnPc()` / `hideOnPhone()`）で表す。可視性を `display:none` で切り替える
  ノードの下のスタイルは、原則 `cssMain`（無条件）に戻す。ブレークポイント関数を props で配り歩かない。
- **`responsive()` は「表示中の 1 要素の値がブレークポイントで変わる」場合だけ**に限定する
  （例: PC だけ `position: sticky`）。構造もインタラクションも別物なら、デザインごとに別コンポーネントへ割り、
  内部はメディアクエリフリー、切替はマウント地点の `hideOnPc()` / `hideOnPhone()` 1 行に保つ。

### 9.6 島でのスタイル収集の制約

CSS は **SSR 描画パスで実際に実行されたスタイル登録だけ**を集めて生成する。静的コンテンツは常に一致するが、
**島（クライアントで再描画される箇所）**では、初期 SSR 描画で実行されないスタイル登録が CSS 未生成になり、
その状態がクライアントで現れると無スタイルになる（ランタイム注入しない原則のため後から補えない）。

```tsx
// ✗ 破綻例: 初期 open=false では <Panel> が描画されず、Panel 内のスタイル登録が走らない
function Toggle() {
    const [open, setOpen] = useState(false);
    return <div>{open && <Panel />}</div>;
}
```

守るためのパターン:

- **遅延マウントされる部分は `styleSample()` でサンプルを登録する**。本描画の完了後にサーバー側でだけ
  レンダリングされ（出力 HTML は破棄）、子孫まで含めたスタイルが収集される（クライアントでは no-op）。

  ```tsx
  import { styleSample } from "cirrojs";

  function Toggle() {
      const [open, setOpen] = useState(false);
      styleSample(<Panel />); // Panel とその子孫のスタイルを初期 SSR 描画で収集
      return <div>{open && <Panel />}</div>;
  }
  ```

- **全バリアントを無条件に評価し、`className` の差し替えで切り替える**（状態が変わっても未生成クラスが出ない）。
- **条件付きマウントより「CSS で表示/非表示」を優先**する（`{open && <Modal/>}` ではなく常に描画して
  `display:none` を切り替える）。

理由と理論的背景（なぜこの制約が原理的に残るか）は `05_STYLING.md` 7.3 / 7.4。

---

## 10. 安全な参照 — リンクと画像

サイト内リンク・画像は素の `<a>` / `<img>` ではなく専用コンポーネントで書く。レンダリング中に参照先の
存在がビルド時に検証され、リンク切れ・参照切れが CI で止まる。検証は opt-in（素の `<a>` / `<img>` は検証
されない）で、外部参照は素のタグに逃がす、という契約で一貫する。

### 10.1 Link — サイト内リンク

```tsx
import { Link } from "cirrojs";

<Link to="/about">このサイトについて</Link>
<Link to="/tags/react" className={chip()}>#react</Link>
<Link to="#section-1">ページ内アンカー</Link>
```

- `to` には**ルート相対パス（`/` 始まり）**か**ページ内アンカー（`#` 始まり）**を書く。それ以外
  （相対パス・外部 URL・プロトコル相対の `//` 始まり）は不正として報告される。外部サイトへのリンクは素の
  `<a>` を使う。
- `href` 以外の `<a>` の標準属性（`className` / `target` / `download` など）はそのまま渡せる。
  **書いた `to` がそのまま href として出力される**（Cirro は書き換えない。クリーン URL にしたいなら最初から
  そう書く）。
- リンク先として有効なのは、`routes.ts` の全ルート（静的・動的・ファイルルート）と `public/` 配下のファイル。
  `/about.html` と `/about`（クリーン URL）、`/path/to/` と `/path/to` はどれも受理される。`?query` と
  `#fragment` は存在チェックでは無視される。
- 違反は dev ではコンソール警告、`cirro build` では全ページ分をページ path 付きでまとめて報告して非ゼロ終了。

設計判断は `09_LINK_SAFETY.md`。

### 10.2 Image — 画像

サイト内画像は `<Image from="...">` で書く。参照先の存在がビルド時に検証される。

```tsx
import { Image } from "cirrojs";

<Image from="/assets/image/logo.svg" alt="ロゴ" className={cssMain({ height: "3rem" })} />
```

- `from` は **`public/` 基準のルート相対パス（`/` 始まり）**。public の実ファイルと照合され、無ければ
  ビルドが落ちる。`src` は型から除外され `from` に一本化される。
- `<img>` の標準属性（`alt` / `width` / `height` / `loading` / `className` 等）はそのまま渡せる。
- Image は**検証に徹する**。画像最適化（リサイズ・srcset・フォーマット変換）は行わない。
- **外部画像は素の `<img>` で書く**（種別を濁さないため。推奨 CSP では外部画像はブロックされるので、使う
  場合は `img-src` を緩める）。

> npm パッケージ同梱アセット（`pkg:/path`）や自サイトソース（`:/path`）を dist へコピーする種別は設計済みだが
> 未実装で、書くと「未対応」として報告される。現状の `<Image>` は public 照合が対象。詳細は `10_IMAGE_ASSETS.md`。

### 10.3 FaImage — Font Awesome アイコン

Font Awesome を `pnpm add` せずゼロステップで使える専用コンポーネント。cirrojs が同梱するスプライトへの
`<use>` 参照（インライン `<svg>`）を出力する。

```tsx
import { FaImage } from "cirrojs";

<FaImage icon={{ type: "solid", name: "house" }} className={cssMain({ height: "2rem" })} />
```

- `icon` は `{ type: "solid" | "regular" | "brands"; name: ... }` の判別可能ユニオン。`name` はスタイルごとの
  リテラルユニオンで補完が効き、**存在しないアイコンはコンパイル時に弾ける**（バージョン固定同梱のため）。
- 既定で `aria-hidden`（装飾扱い）・`height="1em"`（周囲テキストに追従）・色は `currentColor`（テキスト色に
  追従）。意味を持たせる場合は `aria-hidden={false}` と `aria-label` を渡す。
- build では**参照されたスタイルのスプライトだけ**が `dist/fa/` にコピーされる。島がクリック後に初めて使う
  アイコンは `styleSample()` で申告すれば収集される（9.6 と同じレール）。
- 純粋なマークアップであり、インラインスクリプトを生じない（CSP 厳格性を保つ）。

設計判断は `10_IMAGE_ASSETS.md` 5.7。

---

## 11. サイトメタデータ（SEO）

sitemap / RSS / OGP は絶対 URL を必要とするため、サイトメタデータを `defineSite()` で宣言する
（設計は `12_SITE_METADATA.md`）。宣言は任意で、これらの機能を使わないサイトでは不要。site が未宣言のまま
ヘルパーを使うと、dev は警告・build はページ path 付きで報告して非ゼロ終了する。

### 11.1 defineSite

```ts
// src/site.ts
import { defineSite } from "cirrojs";

export const site = defineSite({
    origin: "https://example.com", // スキーム + ホストのみ（パス・末尾スラッシュ不可。宣言時に検証）
    title: "サイトのタイトル",       // RSS channel title / og:site_name
    description: "サイトの説明",     // RSS channel description / og:description の既定（任意）
    lang: "ja",                     // RSS <language>（任意）
});
```

```ts
// src/routes.ts — createRouteFn にオブジェクトで渡す（content と同じ二重チャネル配線）
const { defineRoutes, route } = createRouteFn({ content, site });
```

`site.title` のように直接 import して参照もできる（フッターへのサイト名表示等）。

### 11.2 sitemap

ファイルルート 1 行で宣言する。静的・動的ルートの全展開 URL がクリーン URL 正規形で収録される
（ファイルルート・合成ルート・public は含まない）。`sitemapXml({ filter })` でページを除外できる。

```ts
import { sitemapXml } from "cirrojs";

route({ type: "file", path: "/sitemap.xml", component: sitemapXml() }),
```

`lastmod` / `changefreq` / `priority` は出力しない（信頼できる更新日時の情報源が現状ないため）。

### 11.3 RSS

`rssXml()` をファイルルートのコンポーネント内で呼ぶ。channel の title / description / language は site から
補われ、引数で上書きもできる（タグ別フィード等）。item の `path` は Link と同じレールで**存在がビルド時に
検証される**。`lastBuildDate` は items の date の最大値（ビルドの決定性を保つため現在時刻は使わない）。

```ts
// src/pages/rss.ts
import { type PageProps, rssXml } from "cirrojs";
import type { content } from "../content";

export function rssFeed(props: PageProps<typeof content>): string {
    return rssXml({
        items: props.content.posts.map((post) => ({
            title: post.title,
            path: `/blog/${post.slug}`, // ルート相対。存在検証される
            date: new Date(post.date),
            description: post.description,
        })),
    });
}

// routes.ts: route({ type: "file", path: "/rss.xml", component: rssFeed }),
```

出力は RSS 2.0 のみ。

### 11.4 OGP と absoluteUrl / pageUrl

`<Ogp>` コンポーネントをページ（レイアウト）に置く。React 19 の巻き上げで `<head>` へ入るため、置く場所は
問わない。**`og:url` は現在レンダリング中のページから自動で決まる**ので、ページごとの URL は書かない。
`image` はルート相対パスで、public 配下との照合で存在検証される。

```tsx
import { Ogp } from "cirrojs";

<Ogp title={title} description={description} type="article" image="/images/ogp.png" />
```

低レベルヘルパーとして `absoluteUrl(path)`（ルート相対 path の絶対 URL 化 + 存在検証）と `pageUrl()`
（現在ページの絶対 URL）も使える（JSON-LD 等の自作メタデータ向け）。

制約:

- ヘルパーが受けるのは**ルート相対パスのみ**。外部 URL の OGP 画像等は素の `<meta>` で書く。
- `<Ogp>` / `absoluteUrl()` / `pageUrl()` は **SSR 専用**。島（クライアント）内では使えない。
- origin は**ルート配信のみ**（サブパス配下のデプロイは非対応）。フィードは RSS 2.0 のみ。

---

## 12. ビルド時チェック（間違えたら教えてくれる）

Cirro は「設定を間違えると、エラーではなく動作の欠落や dev / build の食い違いとして現れる」silent failure を
ビルド時・開発時に検出する（設計は `14_CONFIG_VALIDATION.md`）。**設定そのものの誤りは即エラー**、
**コンテンツに依存する違反は全件収集して build は一括報告 + 非ゼロ終了 / dev は警告**という方針で、生成後の
成果物は走査しない。主な検出項目:

| 検出する誤り | 挙動 |
| --- | --- |
| `<Island>` を使っているのに `cirro({ islands })` 未設定 | エラー（解決方法を提示） |
| `options.islands` のレジストリに無い島名を使用 | ページ path 付きでエラー |
| 出力パスの重複（slug 重複・静的ルートの重複宣言） | 全件収集して報告 |
| ルート `path` の形式違反（`/` 始まりでない・`.html` 終端でない・`..` `//` `\` を含む等） | 報告 |
| `public/` のファイルとルートの出力パスが衝突 | 報告 |
| `<Island>` の props が JSON 直列化不能（関数・`Date`・ReactNode 等） | ページ path・島名・キーパス付きで報告 |
| `cssUrl` の形式違反（`/` 始まりでない等） / `routes` `islands` ファイルが不在 | 設定解決時に即 throw |
| `watchDir` が実在しない | 警告（動作は正しいため） |
| `@layer` を使っているのに `defineCascadeLayer()` で宣言していない | 警告（カスケードが初出順にズレる恐れ） |
| リンク切れ・画像参照切れ（`<Link>` / `<Image>` / Markdown 本文） | 10 章・8.5 のとおり報告 |

`routes.ts` の `runWithRegistry` 再 export 忘れ・default export 忘れ・content ハンドルの loader 欠落も
fail-loud で検出される。これらにより「正しい形から始められ、外れたら教えてくれる」状態が担保される。

---

## 13. CSP（まとめ）

Cirro の生成物は、これまでの仕組みにより **インラインスクリプトもインラインスタイルも含まない**。そのため
`unsafe-inline` なしの厳格な CSP で配信できる。

### 13.1 推奨ヘッダと対応表

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'
```

| CSP 条項 | 満たす仕組み |
| --- | --- |
| `script-src 'self'` | 島マウンタ・島コードはすべて外部 JS（`<script src>`）。props は `data-*` 属性で渡す（6 章） |
| `style-src 'self'` | 自前 CSS（9 章）がビルド時に外部 CSS を生成。`<style>` も `style=""` も出さない |
| `font-src 'self'` | システムフォントスタックを使い外部フォントを読まない |

外部画像を使う場合は `img-src` を、Markdown 等で外部リソースを読む場合は該当ディレクティブを利用者側で緩める。

### 13.2 CSP meta の出し分け（dev / build）

CSP は HTTP レスポンスヘッダで与えるのが本来の形だが、配信先でヘッダを付けられない場合に備え、`<head>` へ
`<meta http-equiv="Content-Security-Policy">` を出力する選択肢を**利用者の任意**として残している
（Cirro は meta を自動挿入しない）。

ただし dev サーバ（`cirro dev`）では HMR クライアント等の開発時専用インラインスクリプトが Vite から注入
されるため、厳格な CSP を当てると開発が成立しない。そこで **`cirro build` のときだけ CSP meta を出力し、
`cirro dev` では出力しない**という出し分けを、Cirro が立てる環境変数 `process.env.CIRRO_COMMAND`
（build で `"build"`、dev で `"dev"`）で行う。

```tsx
// <head> を組み立てる箇所（Layout.tsx など）
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'";

<head>
    <meta charSet="utf-8" />
    {process.env.CIRRO_COMMAND === "build" ? (
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
    ) : null}
    <title>{title}</title>
</head>
```

`<head>` は静的部分なのでブラウザに送られず、島（クライアント）バンドルへこの分岐は含まれない。ヘッダで
CSP を付けられる配信なら meta は不要なので、この出し分け自体を使わなくてもよい。

---

## 14. デプロイとキャッシュ（Cloudflare Workers スタティックアセット）

`cirro build` の成果物（`dist/`）を Cloudflare（Pages / Workers Assets）へデプロイする。成果物には
キャッシュの観点で性質の異なる 2 種類のアセットが混ざっている。

1. **安定名アセット**: URL が固定で内容だけが変わり得るもの。`/assets/styles.css`（全ページのレンダリング後に
   確定する収集型の成果物）、`/fa/{style}.svg`（Font Awesome スプライト）、`public/` 配下のファイル。
2. **ハッシュ名アセット**: 内容が変わると URL 自体が変わるもの。Vite が生成する島の JS チャンク
   （`/assets/*-<hash>.js`）。

### 14.1 成果物

- 各ルートの `.html`（本文は純粋な静的 HTML、マーカーなし）。
- 島用の外部 JS チャンク（`<script src>` で読まれる。インラインスクリプトなし）。
- 静的アセット（`public/` の内容、CSS、参照された FA スプライトなど）。

### 14.2 安定名アセットは既定で安全

Workers のスタティックアセット配信は、デフォルトで **`Cache-Control: public, max-age=0, must-revalidate`** と
**`ETag`** を付けて応答する。ブラウザはキャッシュを保持しつつ使用前に毎回 `If-None-Match` で鮮度を確認し、
変わっていなければ **304 Not Modified** で済む。したがって安定名アセットについて**利用者側の設定は不要**で、
「デプロイで `styles.css` やスプライトの内容が変わったのに古いキャッシュが使われ続ける」事故は起きない。

### 14.3 ハッシュ名アセットに immutable（任意）

ハッシュ名アセットは内容が変われば URL が変わるので、再検証すら不要である。`public/_headers` に以下を置くと
（Vite が `dist/` へコピーし、Workers が設定として解釈する）、304 の往復も消える。

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

`_headers` は Pages と同じ構文（ワイルドカード対応・ルール 100 個まで・静的アセット配信のみに適用）。
なお `/assets/styles.css` は安定名なのにこのパターンに含まれてしまう点に注意。マッチした全ルールのヘッダが
適用され、**同名ヘッダは上書きではなくカンマ結合される**ため、特定パスだけ値を変えるには `!` プレフィックスで
一度取り消してから設定し直す。

```
/assets/styles.css
  ! Cache-Control
  Cache-Control: public, max-age=0, must-revalidate
```

あるいは `cssUrl` オプションで CSS を `/assets/` の外へ出し、`/assets/*` をハッシュ名アセット専用に保ってもよい。

---

## 15. dev / build の仕組み（内部・読み飛ばし可）

利用に必須ではないが、トラブル時の手掛かりとして仕組みを簡潔に残す。

### 15.1 dev（`cirro dev`）

`runtime/dev.ts` が Vite を **middleware モード**で起動し、リクエストごとに SSR + ルーティングを行う。

1. リクエスト URL に一致するルートを解決（Module Runner で常に最新を評価）。
2. コンテンツ層があれば `loader()` の結果を用意（初回リクエストで実行しキャッシュ。7.3）。
3. ページをレンダリングし、島マウンタの `<script>` を併置して `renderToStaticMarkup` で HTML 化。
4. `vite.transformIndexHtml` を通して返す（HMR クライアントの注入等）。

ファイル監視は、**島ディレクトリ配下**は React Fast Refresh に委ね、**`watchDir` 配下のその他**（ページ・
ルート定義・Markdown 等）は変更・追加・削除時に SSR / コンテンツキャッシュを無効化してから full-reload する。

### 15.2 build（`cirro build`）

`runtime/build.ts` が 2 段で静的サイトを生成する。

1. **`vite build`** … 島マウンタのクライアントバンドルと `manifest.json` を生成（CSP 厳格設定は注入済み）。
2. **各ルートを静的 HTML 化** … 一時 SSR サーバで `routes` を評価し、コンテンツ層があれば `loader()` を
   await したうえで、`expandRoutes` が展開した全 URL について島用 JS への `<script>` を併置して
   `renderToStaticMarkup` し、`dist/` にクリーン URL のパスで書き出す。

---

## 付録

### 公開 API（抜粋）

| import 元 | 主な API |
| --- | --- |
| `cirrojs` | `createRouteFn` / `defineContent` / `defineSite` / `PageProps`（型）/ `Link` / `Image` / `FaImage` / `Ogp` / `sitemapXml` / `rssXml` / `absoluteUrl` / `pageUrl` / `ss` / `at` / `atStatement` / `toStyle` / `toKeyframes` / `genCssFn` / `styleSample` / `runWithRegistry` / `Properties`（型） |
| `cirrojs/server` | `createIsland` / `createMarkdownProcessor` / `markdownToText` / `ToC`（型） |
| `cirrojs/vite` | `cirro`（Vite プラグイン） |
| `cirrojs/layout` | `createLayout` / `cx` / `defineCascadeLayer` / `resetCss` |

スタイリング（`05`）・レイアウト（`05` 10 章）の完全な API 表はそれぞれのドキュメントを参照。

### 用語

| 用語 | 意味 |
| --- | --- |
| 島（island） | 静的 HTML の中で、クライアントでインタラクティブに動く小領域 |
| ハイドレーション | サーバー出力の HTML を作り直さず、イベントと状態を後付けして動かすこと（`hydrateRoot`） |
| Config Base Routing | `routes.ts` に型付きオブジェクトでルートを宣言する方式 |
| 厳格 CSP | `unsafe-inline` を含まない Content Security Policy（`script-src 'self'` 等） |
| MPA | Multi-Page Application。各ページ独立の静的配信 |

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（背景・目的・スコープ）
- `02_CLIENT_SCRIPT_BUNDLING.md` — クライアントスクリプトの配信・バンドル
- `03_ISLAND_SYSTEM.md` — 島システムの使い方と内部の仕組み
- `05_STYLING.md` — スタイリングガイド（自前 CSS 生成の完全版）
- `06_STYLING_DIRECTION.md` / `07_RESPONSIVE_STYLING.md` — スタイリングの設計・レスポンシブ運用
- `08_CONTENT_LAYER.md` — コンテンツ層の設計（defineContent）
- `09_LINK_SAFETY.md` — リンク安全性の設計（Link）
- `10_IMAGE_ASSETS.md` — 画像アセットの設計（Image / FaImage）
- `12_SITE_METADATA.md` — サイトメタデータの設計（defineSite / sitemap / RSS / OGP）
- `13_MARKDOWN_REF_CHECK.md` — Markdown 内参照検証の設計（checkRefs）
- `14_CONFIG_VALIDATION.md` — ビルド時チェックの設計
- `16_SCAFFOLDING.md` — スキャフォールディングの設計（create-cirro）
