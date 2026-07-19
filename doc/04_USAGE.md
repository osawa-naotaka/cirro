# Cirro 利用ガイド

本ドキュメントは Cirro の **使い方を一通り通す実践ガイド**である。Vite プラグインとしての導入から、
CLI、サイトのコードの書き方、dev サーバー / build、島システム、コンテンツ層、Markdown までを扱う。
スタイリング（自前 CSS 生成）は `05_STYLING.md` を参照。

- **なぜ**この設計なのか（背景・目的）は `01_CHARTER.md` を参照。
- クライアントスクリプトの配信・バンドルの内部は `02_CLIENT_SCRIPT_BUNDLING.md` を参照。
- 島（islands）の内部の仕組みは `03_ISLAND_SYSTEM.md` を参照（本書 6 章は使い方の要約に留める）。

題材は `examples/basic`（最小構成）と `examples/blog`（Markdown + 自前 CSS の実運用例）の実コードに即す。

---

## 1. はじめに / 前提

Cirro は、React の島（islands）アーキテクチャで **インラインスクリプトを一切生成せず、`script-src 'self'`
の厳格な CSP を満たす**静的サイト（MPA）を生成する軽量 SSG である。本文はビルド時に静的 HTML 化され、
インタラクティブな「島」だけがクライアントでハイドレートされる。

### 前提パッケージ

Cirro は次を **peer dependency** として要求する（利用者の `package.json` に入れる）。

| パッケージ | 役割 |
| --- | --- |
| `react` / `react-dom` | v19 系。サーバーレンダリングとハイドレーション |
| `vite` | v8 系。ビルド基盤 |
| `@vitejs/plugin-react` | React 変換（Cirro は内包しない。利用者が明示的に追加する） |

パッケージ管理は **pnpm** を前提とする（`pnpm install` / `pnpm run`）。

---

## 2. プロジェクトのセットアップ

### 2.1 ディレクトリ構成

最小構成（`examples/basic`）の典型は次の通り。

```
my-site/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts          # react() + cirro() を登録
└─ src/
   ├─ routes.ts            # サイトのルート定義（Config Base Routing）
   ├─ pages/               # 各ルートのページコンポーネント
   │  ├─ home.tsx
   │  └─ about.tsx
   └─ islands/
      ├─ registry.ts       # 島の対応表（純データ）
      ├─ Island.ts         # createIsland(islands) で型付き <Island> を生成
      └─ Counter.tsx       # 島コンポーネント
```

### 2.2 package.json のスクリプト規約

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
- `build` … **`tsc` を先に通してから** `cirro build`。型エラーを含んだまま静的 HTML を生成しないための作法。
- `preview` … ビルド結果の確認は Vite 標準の `vite preview` を使う（Cirro 独自コマンドではない）。

### 2.3 tsconfig.json

`examples/basic` の要点（ワークスペースで Cirro をソース解決しているため `.ts` 拡張子 import を許可）。

```jsonc
{
    "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "bundler",
        "jsx": "react-jsx",
        "strict": true,
        "verbatimModuleSyntax": true,
        "lib": ["ESNext", "DOM", "DOM.Iterable"],
        "types": ["vite/client"]
    },
    "include": ["src", "vite.config.ts"]
}
```

---

## 3. Vite プラグインとしての Cirro

Cirro の本体は 1 つの Vite プラグイン `cirro()` として提供される。`vite.config.ts` に登録する。

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { cirro } from "cirrojs/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        react(), // ← 必ず cirro() より前に置く
        cirro({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" }),
    ],
});
```

### 3.1 react() を先に置く理由

Cirro は `@vitejs/plugin-react` を**内包しない**（RSC 系プラグインと同じ作法で、利用者が明示的に追加する）。
`cirro()` は `configResolved` フックで React プラグインの有無を検出し、見つからなければ
**ビルド時にエラーで知らせる**。`react()` を `cirro()` より前に置くこと。

### 3.2 CirroOptions

| オプション | 必須 | 既定値 | 意味 |
| --- | --- | --- | --- |
| `routes` | ✓ | — | ルート定義ファイル（`routes` を export する `.ts`）への相対パス |
| `islands` |　— | — | 島レジストリ（`islands` を export する `.ts`）への相対パス |
| `watchDir` | — | `./src` | dev サーバーが full-reload の対象として監視するディレクトリ |

### 3.3 プラグインが裏で行うこと

`cirro()` は `config()` フックで、CSP 厳格化のためのビルド設定を自動注入する。

- `assetsInlineLimit: 0` … 小さなアセットを data URI でインライン化しない。
- `modulePreload.polyfill: false` … モジュールプリロードの polyfill（インラインスクリプト）を無効化。
- `manifest: true` … ビルド成果物のファイル名対応表を出力（build が島用 JS のパスを引くのに使う）。
- `rollupOptions.input.client` … 島マウンタ（仮想モジュール `virtual:cirro/client`）を単一エントリに指定。

これらの詳細・背景は `02_CLIENT_SCRIPT_BUNDLING.md` と `03_ISLAND_SYSTEM.md` を参照。

---

## 4. CLI の使い方

Cirro の CLI は `cirro <dev|build>` の 2 コマンドのみ（`packages/cirrojs/src/cli.ts`）。`bin` ランチャー
（`cli.sh`）が `main()` を呼ぶ。

| コマンド | 役割 |
| --- | --- |
| `cirro dev` | dev サーバーを起動（SSR + ルーティング + HMR）。既定 `http://localhost:5173` |
| `cirro build` | 静的サイトを生成し `dist/` に書き出す |

プレビューは CLI ではなく **`vite preview`** を使う（2.2 参照）。

```sh
bun run dev      # 開発
bun run build    # 本番ビルド（tsc → cirro build）
bun run preview  # 生成物の確認
```

---

## 5. サイトのコードの書き方

### 5.1 ルーティング（Config Base Routing）

ファイルベースルーティングは採用せず、`routes.ts` に **型付きの JavaScript オブジェクト**として
ルートを宣言する。正規表現や独自の文字列記法は使わない（型と関数で表現する方針）。

ルートビルダーは `createRouteFn()` ファクトリから取得する。`route()` に **静的ルート（`type: "static"`）・
動的ルート（`type: "dynamic"`）・ファイルルート（`type: "file"`）**の定義オブジェクトを渡して宣言し、
`defineRoutes()` で束ねて default export する。コンテンツ層（5.5）を使う場合は `createRouteFn(content)` と
ハンドルを渡す。これにより `getStaticPaths` と各ページコンポーネントへ型付きの `content` が配られる。

```ts
// src/routes.ts
import { createRouteFn } from "cirrojs";
import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { generateSearchIndex } from "./pages/search-index";

// 自前 CSS のレジストリ関数を再 export する（必須・05_STYLING.md 7.2 参照）
export { runWithRegistry } from "cirrojs";

// コンテンツ層を使う場合は createRouteFn(content) と渡す（5.5 参照）
const { defineRoutes, route } = createRouteFn();

export default defineRoutes(
    // 静的ルート: path は固定文字列
    route({ type: "static", path: "/index.html", component: HomePage }),
    route({ type: "static", path: "/about.html", component: AboutPage }),

    // 動的ルート: path は params から URL を生成する関数
    route({
        type: "dynamic",
        path: ({ slug }) => `/posts/${slug}.html`,        // params から URL を生成
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

- **静的ルート** `{ type: "static", path, component }` … `path` は固定文字列。`component` は React 要素を返す。
- **動的ルート** `{ type: "dynamic", path, getStaticPaths, component }` … `getStaticPaths()` が返す
  各 params を `path()` 関数に通して URL を生成する。コンテンツ層を使う場合、`getStaticPaths` は
  引数に `content` を受け取る（5.5 参照）。`component` は React 要素を返す。
- **ファイルルート** `{ type: "file", path, component }` … 任意のテキストファイルを生成出力する機能。
  `component` は **React 要素ではなく文字列を返す**関数で、その文字列が `path`（拡張子まで含む固定パス）
  へそのまま書き出される。`examples/blog` では検索インデックス（`/search-index.json`）の生成に使っている
  （`src/pages/search-index.ts`）。
- CSS の URL をルート定義に書く必要はない。ルート単位の CSS はレンダリング結果から自動生成され、
  `<link>` もランタイムが自動挿入する（5.4 と `05_STYLING.md` 7.1 参照）。
- `defineRoutes()` はルート配列とコンテンツハンドルを束ねたオブジェクトを返す。ランタイム（dev / build）は
  この default export からルートと content の loader を取得する。

### 5.2 ページコンポーネント

ページは `<html>` 全体を返す React コンポーネント。`<head>` は手書きする。props は `{ params, content }`
（動的ルートの `params` と、コンテンツ層の `content`。5.5 参照）。使わない prop は受け取らなくてよい。

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
併置して挿入する（`runtime/head.ts` の `appendClientScriptAndCss`）。React 19 のメタデータ巻き上げ
（hoisting）により、これらはツリーのどこに置かれても `<head>` へ自動で巻き上げられる。文字列置換を行わず、
インラインスクリプトも生成しないため、`script-src 'self'` を維持する。

### 5.5 コンテンツ層（defineContent）

ページの描画は `renderToStaticMarkup` による同期処理のため、コンポーネント内で `await` はできない。
DB・CMS・ファイルシステムなどからの非同期なコンテンツ取得は、レンダリングより前に済ませる必要がある。
この「取得（非同期）と描画（同期）の分離」を担うのがコンテンツ層である。
設計判断の背景（検討した代替案と不採用理由）は `08_CONTENT_LAYER.md` を参照。

`defineContent()` に async な `loader` を渡してハンドルを作り、`createRouteFn(content)` に渡す。

```ts
// src/content.ts
import { defineContent } from "cirrojs";

export const content = defineContent({
    loader: async () => {
        const posts = await fetchPosts(); // 任意の非同期取得
        return { posts };
    },
});
```

```ts
// src/routes.ts
import { createRouteFn } from "cirrojs";
import { content } from "./content";

const { defineRoutes, route } = createRouteFn(content);

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

ランタイムはレンダリング前に `loader()` を一度だけ await し、結果を `getStaticPaths` の引数と
全ルートコンポーネント（ファイルルート含む）の `content` prop へ配る。`loader` の戻り値の型は
`createRouteFn(content)` を通じて `getStaticPaths` と `component` の型チェックに伝播する。

ページ側は `PageProps` で型付けする。第 2 型引数は動的ルートの params。

```tsx
// src/pages/post.tsx
import type { PageProps } from "cirrojs";
import type { content } from "../content";

export function PostPage(props: PageProps<typeof content, { slug: string }>) {
    const post = props.content.posts.find((p) => p.slug === props.params.slug);
    // ...
}
```

補足:

- **実行タイミング**: build では生成開始前に 1 回。dev では初回リクエストで実行して結果をキャッシュし、
  `watchDir` 配下のファイルの変更・追加・削除でキャッシュを破棄して次のリクエストで再実行する。
- **出自は問わない**: loader が返すものがコンテンツである。glob で読んだ Markdown（7.3 参照）、
  ネットワーク越しのフェッチ結果、手書きの JavaScript オブジェクトを 1 つのストアに合成してよい。
- **コンテンツはビルド時専用**: `content` はサーバー側（SSR）にのみ存在し、島（クライアント）からは
  参照できない。島に渡したいデータは `<Island>` の props として明示的に渡す。
- コンテンツ層を使わないサイトは `createRouteFn()` を引数なしで呼ぶ（`examples/basic`）。

### 5.6 サイト内リンク（Link コンポーネント）

サイト内リンクは素の `<a>` ではなく `<Link>` で書く。レンダリングされた Link の `to` は
サイト内の全 URL と照合され、**リンク切れがビルド時に検出される**。
設計判断の背景は `09_LINK_SAFETY.md` を参照。

```tsx
import { Link } from "cirrojs";

<Link to="/about">このサイトについて</Link>
<Link to="/tags/react" className={chip()}>#react</Link>
<Link to="#section-1">ページ内アンカー</Link>
```

- `to` には**ルート相対パス（`/` 始まり）**か**ページ内アンカー（`#` 始まり）**を書く。それ以外
  （相対パス・外部 URL・プロトコル相対の `//` 始まり）は不正として報告される。外部サイトへの
  リンクは素の `<a>` を使う。
- `href` 以外の `<a>` の標準属性（`className`・`target`・`download` など）はそのまま渡せる。
  `href` は `to` に一本化されており、**書いた `to` がそのまま href として出力される**（Cirro は
  書き換えない。クリーン URL に正規化したい場合は最初からそう書く）。
- リンク先として有効なのは、`routes.ts` の全ルート（静的・動的・ファイルルート）と `public/`
  配下のファイル。`/about.html` と `/about`（クリーン URL）、ディレクトリインデックスの
  `/path/to/` と `/path/to` はどれも受理される。`?query` と `#fragment` は存在チェックでは
  無視される。
- リンク切れ・不正な `to` は、**dev サーバーではコンソール警告**、**`cirro build` では全ページ分を
  ページ path 付きでまとめて報告して非ゼロ終了**（CI で止まる）。
- Markdown 本文中のリンクと素の `<a href>` は検証対象外（検証は Link を使うことによる opt-in）。

---

## 6. 島（islands）システム

> 仕組みの詳細（`hydrateRoot`、`data-*` 受け渡し、仮想モジュール、型安全性）は `03_ISLAND_SYSTEM.md` に
> 集約している。ここでは使い方の最小要約のみ示す。

島を使う 3 ステップ:

1. **島コンポーネントを書く**（`src/islands/Counter.tsx`）— ふつうの React コンポーネント。
2. **レジストリに登録**（`src/islands/registry.ts`）— 純データの対応表を default export する。 必ず `export default ...` とすること。cirroはdefault exportを探すため。

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

ページでは `<Island name="counter" props={{ initial: 3 }} />` のように使う。`name` と `props` は
レジストリに対して型チェックされる。

### 6.1 クライアント JS は全ページ共有の単一バンドル（設計）

全ページが、島マウンタと全島のコードを束ねた**同一の JS ファイル**を読み込む。島を使わない
ページも同じである。これは制限ではなく設計判断であり、ページ単位の JS 分割（島ゼロページの
JS ゼロ化を含む）はスコープ外とした（背景と理由は `01_CHARTER.md` 2.3 参照。要約: 対象領域では
JS が小さい・MPA では共有 1 ファイルがページ間でキャッシュされ 2 ページ目以降の転送がゼロになる・
実サイトではヘッダー島により島ゼロページは稀）。

**トレードオフ**: 特定ページでしか使わない重い島（チャート描画ライブラリ等）を registry に
登録すると、そのコードが共有バンドルに乗り全ページの初回ロードが重くなる。

**逃げ道**: 重い部分は島の内部で `React.lazy` + dynamic import に切り出す。Rollup が動的 import を
自動で別チャンクに分割し、実際に必要になったときだけ取得される（ビルド成果物で検証済み: 分割
チャンクはハッシュ名の別ファイルになり、共有バンドルには含まれず、HTML の `<script>` は 1 本の
まま。動的 import は許可済み外部スクリプトからのモジュール取得なので `script-src 'self'` も維持
される）。

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

注意点:

- 遅延部分が初期表示に含まれる場合（クリック後ではなく最初から表示される場合）、SSR は
  Suspense の fallback を出力し、クライアントで取得完了後に本体へ置き換わる。初期表示に必要な
  ものは遅延させず、ユーザー操作の先にあるものだけを遅延させるのがよい。
- 遅延コンポーネント内のスタイル登録は初期 SSR 描画で実行されないため、`styleSample()` で
  サンプルを申告する（`05_STYLING.md` 7.3 の既存の制約と同じレール）。

---

## 7. Markdown コンテンツ

Cirro は `createMarkdownProcessor()` ファクトリで Markdown 描画 API を提供する（`packages/cirrojs/src/markdown.tsx`）。
変換はビルド時（SSR）に同期実行され、結果は静的 HTML として埋め込まれる。**unified 一式の JS は
クライアントへ送られない**（サーバー専用）。

### 7.1 パイプラインの構築

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

### 7.2 サニタイズは固定で強制される

`createMarkdown` のパイプラインは、**ユーザープラグイン層 → `rehype-sanitize`（固定の防衛線）→
信頼済み層（ハイライト等）**という二層構造になっている。ユーザーが上流で何を生成しても、必ず
`rehype-sanitize` の許可リストのサブセットだけが通る。`remark-rehype` には `allowDangerousHtml` を
渡さないため、raw HTML も通らない。サニタイズを無効化する手段はあえて提供していない（CMS 等の
信頼できない入力も想定した脅威モデル）。

戻り値は型レベルで「サニタイズ済み HTML」に限定され、生の文字列を誤って埋め込めないようになっている。

### 7.3 frontmatter とコンテンツの読み込み

記事メタデータは frontmatter で持ち、`gray-matter` 等でパースする。読み込みとパースはコンテンツ層
（5.5 参照）の loader 内で行う。Markdown ファイルは Vite の `import.meta.glob`（`?raw` + `eager`）で
ビルド時に文字列として読み込む（`examples/blog` の `src/content.ts`）。

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

### 7.4 ページでの描画

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
子孫セレクタでスタイルする。`05_STYLING.md` 参照）。

---

## 8. dev サーバーと build の仕組み

### 8.1 dev（`cirro dev`）

`runtime/dev.ts` が、Vite を **middleware モード**で起動し、リクエストごとに SSR + ルーティングを行う。

1. リクエストの URL に一致するルートを `routes`（Module Runner で常に最新を評価）から解決する。
2. コンテンツ層があれば `loader()` の結果を用意する（初回リクエストで実行し、以降はキャッシュ。5.5 参照）。
3. ページをレンダリングし、島マウンタの `<script>` を併置して `renderToStaticMarkup` で HTML 化する。
4. `vite.transformIndexHtml` を通して返す（HMR クライアントの注入等）。

ファイル監視は次の方針:

- **島ディレクトリ配下** … React Fast Refresh に委ねる（full-reload しない）。
- **`watchDir`（既定 `./src`）配下のその他** … ページ・ルート定義・Markdown など、クライアント HMR の
  境界を持たないものを含むため、変更・追加・削除時は SSR モジュールキャッシュとコンテンツキャッシュ（5.5）を
  無効化してから **full-reload** する。`import.meta.glob` で読むコンテンツはファイルの追加・削除でも
  結果が変わるため、`change` に加えて `add` / `unlink` も監視する。

### 8.2 build（`cirro build`）

`runtime/build.ts` が 2 段で静的サイトを生成する。

1. **`vite build`** … 島マウンタのクライアントバンドルと `manifest.json` を生成（CSP 厳格設定はプラグインが注入済み）。
2. **各ルートを静的 HTML 化** … 一時的な SSR サーバで `routes` を評価し、コンテンツ層があれば
   `loader()` を await したうえで、`expandRoutes` が展開した全 URL について、島用 JS への `<script>` を
   併置して `renderToStaticMarkup` し、`dist/` にクリーン URL のパスで書き出す。

### 8.3 成果物

- 各ルートの `.html`（本文は純粋な静的 HTML、マーカーなし）。
- 島用の外部 JS チャンク（`<script src>` で読まれる。インラインスクリプトなし）。
- 静的アセット（`public/` の内容、CSS など）。

---

## 9. CSP（まとめ）

Cirro の生成物は、上記の仕組みにより **インラインスクリプトもインラインスタイルも含まない** 。そのため `unsafe-inline` なしの厳格な CSP で配信できる。

推奨ヘッダ例:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'
```

| CSP 条項 | 満たす仕組み |
| --- | --- |
| `script-src 'self'` | 島マウンタ・島コードはすべて外部 JS（`<script src>`）。props は `data-*` 属性で渡す（3 章・6 章） |
| `style-src 'self'` | 自前 CSS（`05_STYLING.md`）がビルド時に外部 CSS を生成。`<style>` も `style=""` も出さない |
| `font-src 'self'` | システムフォントスタックを使い外部フォントを読まない |

### 9.1 CSP の meta 要素は利用者の任意（dev / build で出し分けできる）

CSP は HTTP レスポンスヘッダで与えるのが本来の形だが、配信先（Cloudflare 等）でヘッダを付けられない
場合などに備え、`<head>` へ `<meta http-equiv="Content-Security-Policy">` を出力する選択肢を**利用者の任意**
として残している。Cirro は meta を自動挿入しない。

dev サーバ（`cirro dev`）では、HMR クライアントなど開発時専用のインラインスクリプトが Vite から注入される
ため、厳格な CSP を当てると開発が成立しない。そこで **`cirro build` のときだけ CSP meta を出力し、
`cirro dev` では出力しない**という出し分けが必要になる。

この判別には Cirro が CLI 側で立てる環境変数 **`process.env.CIRRO_COMMAND`** を使う（`cirro build` で
`"build"`、`cirro dev` で `"dev"`）。ページの SSR 描画は dev / build どちらも serve モードの Vite サーバ経由
のため `import.meta.env.PROD` では区別できない。`CIRRO_COMMAND` がこの区別の確実な発生源である。

```tsx
// src/components/Layout.tsx など、<head> を組み立てる箇所
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'";

<head>
    <meta charSet="utf-8" />
    {/* build 時のみ CSP meta を出力。dev では出力しない */}
    {process.env.CIRRO_COMMAND === "build" ? (
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
    ) : null}
    <title>{title}</title>
</head>
```

`process.env.CIRRO_COMMAND` は Node の SSR（ページの静的描画）で読む。`<head>` は静的部分なのでブラウザに
送られず、島（クライアント）バンドルへこの分岐は含まれない。ヘッダで CSP を付けられる配信なら meta は
不要なので、この出し分け自体を使わなくてもよい。

---

## 10. デプロイとキャッシュ（Cloudflare Workers スタティックアセット）

Cirro の成果物には、キャッシュの観点で性質の異なる 2 種類のアセットが混ざっている。

1. **安定名アセット**: URL が固定で、内容だけが変わり得るもの。`/assets/styles.css`（全ページの
   レンダリング後に確定する収集型の成果物）、`/fa/{style}.svg`（Font Awesome スプライト。
   `10_IMAGE_ASSETS.md` 5.7）、`public/` 配下のファイル。
2. **ハッシュ名アセット**: 内容が変わると URL 自体が変わるもの。Vite が生成する島の JS チャンク
   （`/assets/*-<hash>.js`）。

### 10.1 デフォルト挙動で安定名アセットは安全

Workers のスタティックアセット配信は、デフォルトで **`Cache-Control: public, max-age=0,
must-revalidate`** と **`ETag`**（内容のハッシュ）を付けて応答する。ブラウザはキャッシュを保持
しつつ、使用前に毎回 `If-None-Match` で鮮度を確認し、変わっていなければ **304 Not Modified**
（数百バイト）で済む。

したがって安定名アセットについて**利用者側の設定は不要**である。「デプロイで `styles.css` や
スプライトの内容が変わったのに、訪問者に古いキャッシュが使われ続ける」という事故は、この
デフォルトのもとでは起きない。Cirro が収集型の成果物にハッシュ付きファイル名を採用していないのは、
この再検証モデルで正しさが担保されるためでもある（ハッシュはレンダリング完了まで確定できず、
2 パスレンダリング等の複雑さに見合わない）。

### 10.2 ハッシュ名アセットには `immutable` を推奨（任意）

ハッシュ名アセットは内容が変われば URL が変わるので、再検証すら不要である。`public/_headers` に
以下を置くと（Vite が `dist/` へコピーし、Workers が設定として解釈する）、304 の往復も消える:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

`_headers` は Pages と同じ構文で、ワイルドカード対応・ルール 100 個まで・Worker コードが生成した
レスポンスには適用されない（静的アセット配信のみ）。なお `/assets/styles.css` は安定名なのに
このパターンに含まれてしまう点に注意。マッチした全ルールのヘッダが適用され、**同名ヘッダは
上書きではなくカンマ結合される**仕様のため、特定パスだけ値を変えるには `!` プレフィックスで
一度取り消してから設定し直す:

```
/assets/styles.css
  ! Cache-Control
  Cache-Control: public, max-age=0, must-revalidate
```

あるいは `cssUrl` オプションで CSS を `/assets/` の外へ出し、`/assets/*` をハッシュ名アセット
専用に保ってもよい。

---

## 付録

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（背景・目的・スコープ）
- `02_CLIENT_SCRIPT_BUNDLING.md` — クライアントスクリプトの配信・バンドルの現状調査
- `03_ISLAND_SYSTEM.md` — 島システムの使い方と内部の仕組み
- `05_STYLING.md` — スタイリングガイド（自前 CSS 生成）
- `08_CONTENT_LAYER.md` — コンテンツ層の設計（defineContent の設計判断と理由）
- `09_LINK_SAFETY.md` — リンク安全性の設計（Link コンポーネントとビルド時検証の設計判断と理由）
- `10_IMAGE_ASSETS.md` — 画像アセットの設計（Image / FaImage コンポーネントの設計判断と理由）

### 用語

| 用語 | 意味 |
| --- | --- |
| 島（island） | 静的 HTML の中で、クライアントでインタラクティブに動く小領域 |
| ハイドレーション | サーバー出力の HTML を作り直さず、イベントと状態を後付けして動かすこと（`hydrateRoot`） |
| Config Base Routing | `routes.ts` に型付きオブジェクトでルートを宣言する方式 |
| 厳格 CSP | `unsafe-inline` を含まない Content Security Policy（`script-src 'self'` 等） |
| MPA | Multi-Page Application。各ページ独立の静的配信 |
