# Cirro 利用ガイド

本ドキュメントは Cirro の **使い方を一通り通す実践ガイド**である。Vite プラグインとしての導入から、
CLI、サイトのコードの書き方、dev サーバー / build、島システム、Markdown、そして推奨スタイリング
（Panda CSS）までを扱う。

- **なぜ**この設計なのか（背景・目的）は `01_CHARTER.md` を参照。
- クライアントスクリプトの配信・バンドルの内部は `02_CLIENT_SCRIPT_BUNDLING.md` を参照。
- 島（islands）の内部の仕組みは `03_ISLAND_SYSTEM.md` を参照（本書 6 章は使い方の要約に留める）。

題材は `examples/basic`（最小構成）と `examples/blog`（Markdown + Panda CSS の実運用例）の実コードに即す。

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
import { cirro } from "cirro/vite";
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
| `islands` | ✓ | — | 島レジストリ（`islands` を export する `.ts`）への相対パス |
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

Cirro の CLI は `cirro <dev|build>` の 2 コマンドのみ（`packages/cirro/src/cli.ts`）。`bin` ランチャー
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

`routes` は `AnyRoute[]` 型で、各要素は **`type` フィールドが必須**である。`type` の値によって
**静的ルート（`"static"`）・動的ルート（`"dynamic"`）・ファイルルート（`"file"`）**を切り替えて宣言する
（`packages/cirrojs/src/route.ts`）。

```ts
// src/routes.ts
import { type AnyRoute } from "cirrojs";
import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { generateSearchIndex } from "./pages/search-index";

// 自前 CSS のレジストリ関数を再 export する（必須・05_STYLING.md 7.2 参照）
export { runWithRegistry } from "cirrojs";

export const routes: AnyRoute[] = [
    // 静的ルート: path は固定文字列
    { type: "static", path: "/", component: HomePage },
    { type: "static", path: "/about", component: AboutPage },

    // 動的ルート: path は params から URL を生成する関数
    {
        type: "dynamic",
        path: ({ slug }) => `/posts/${slug}`,             // params から URL を生成
        cssPath: "/posts/index.css",                      // 全インスタンスで共有する CSS の URL
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }], // 生成する全 params
        component: PostPage,
    },

    // ファイルルート: 任意のテキストファイルを生成出力する
    {
        type: "file",
        path: "/search-index.json", // 拡張子まで含む出力パス
        component: generateSearchIndex,
    },
];
```

- **静的ルート** `{ type: "static", path, component }` … `path` は固定文字列。`component` は React 要素を返す。
- **動的ルート** `{ type: "dynamic", path, cssPath, getStaticPaths, component }` … `getStaticPaths()` が返す
  各 params を `path()` 関数に通して URL を生成する。`cssPath` には全インスタンスで共有する CSS ファイルの
  URL を明示する（`05_STYLING.md` 7.1 参照）。`component` は React 要素を返す。
  params の型を `path` と `component` で揃えたい場合は `route()` ヘルパーで包むと型が伝わる
  （`import { route } from "cirrojs"`）。
- **ファイルルート** `{ type: "file", path, component }` … 任意のテキストファイルを生成出力する機能。
  `component` は **React 要素ではなく文字列を返す**関数で、その文字列が `path`（拡張子まで含む固定パス）
  へそのまま書き出される。`examples/blog` では検索インデックス（`/search-index.json`）の生成に使っている
  （`src/pages/search-index.ts`）。

ビルド時、静的・動的ルートの各 URL はクリーン URL として静的ファイルに展開される（`/` → `index.html`、
`/about` → `about/index.html`、`/posts/hello` → `posts/hello/index.html`）。ファイルルートは `path` を
そのままの出力パスとして書き出す（`/search-index.json` → `search-index.json`）。

### 5.2 ページコンポーネント

ページは `<html>` 全体を返す React コンポーネント。`<head>` は手書きする。動的ルートは `params` を受け取る。

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
                <link rel="stylesheet" href="/styles.css" />
            </head>
            <body>
                <main>{children}</main>
                {island ? <Island name="scrollTop" props={{}} /> : null}
            </body>
        </html>
    );
}
```

### 5.4 クライアントスクリプトの自動挿入

**利用者は `<script>` を一切書かない**。Cirro が島マウンタ（`virtual:cirro/client`）への
`<script async type="module">` を、レンダリングしたツリーに併置して挿入する（`runtime/head.ts` の
`appendClientScript`）。React 19 のメタデータ巻き上げ（hoisting）により、`<script async>` は
ツリーのどこに置かれても `<head>` へ自動で巻き上げられる。文字列置換を行わず、インラインスクリプトも
生成しないため、`script-src 'self'` を維持する。

---

## 6. 島（islands）システム

> 仕組みの詳細（`hydrateRoot`、`data-*` 受け渡し、仮想モジュール、型安全性）は `03_ISLAND_SYSTEM.md` に
> 集約している。ここでは使い方の最小要約のみ示す。

島を使う 3 ステップ:

1. **島コンポーネントを書く**（`src/islands/Counter.tsx`）— ふつうの React コンポーネント。
2. **レジストリに登録**（`src/islands/registry.ts`）— 純データの対応表を export する。

   ```ts
   import { Counter } from "./Counter";
   export const islands = { counter: Counter } as const;
   ```

3. **型付き `<Island>` を生成**（`src/islands/Island.ts`）— 定型の 5 行。

   ```ts
   import { createIsland } from "cirro";
   import { islands } from "./registry";
   export const Island = createIsland(islands);
   ```

ページでは `<Island name="counter" props={{ initial: 3 }} />` のように使う。`name` と `props` は
レジストリに対して型チェックされる。

**島ゼロのページは JS ゼロにできる**のが Cirro の狙い。`Layout` の `island?: boolean` のように、
島を出さないページでは `<Island>` を一切描画しないことで、そのページに島マウンタが不要であることを
表現する（配信最適化の現状は `02_CLIENT_SCRIPT_BUNDLING.md` を参照）。

---

## 7. Markdown コンテンツ

Cirro は `createMarkdownProcessor()` ファクトリで Markdown 描画 API を提供する（`packages/cirro/src/markdown.tsx`）。
変換はビルド時（SSR）に同期実行され、結果は静的 HTML として埋め込まれる。**unified 一式の JS は
クライアントへ送られない**（サーバー専用）。

### 7.1 パイプラインの構築

サイト側で一度だけ設定済みの描画関数を作る（`examples/blog` の `src/lib/markdown.ts`）。

```ts
import { createMarkdownProcessor } from "cirro";
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

記事メタデータは frontmatter で持ち、`gray-matter` 等でパースする。Markdown ファイルは Vite の
`import.meta.glob`（`?raw` + `eager`）でビルド時に文字列として読み込む（`examples/blog` の `src/lib/content.ts`）。

```ts
import matter from "gray-matter";

const files = import.meta.glob("../content/posts/*.md", {
    query: "?raw", import: "default", eager: true,
}) as Record<string, string>;

export const posts = Object.entries(files).map(([path, raw]) => {
    const { data, content } = matter(raw); // data = frontmatter, content = 本文 Markdown
    return { /* slug, title, date, tags, ... */ content };
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
子孫セレクタでスタイルする。9 章参照）。

---

## 8. dev サーバーと build の仕組み

### 8.1 dev（`cirro dev`）

`runtime/dev.ts` が、Vite を **middleware モード**で起動し、リクエストごとに SSR + ルーティングを行う。

1. リクエストの URL に一致するルートを `routes`（Module Runner で常に最新を評価）から解決する。
2. ページをレンダリングし、島マウンタの `<script>` を併置して `renderToStaticMarkup` で HTML 化する。
3. `vite.transformIndexHtml` を通して返す（HMR クライアントの注入等）。

ファイル監視は次の方針:

- **島ディレクトリ配下** … React Fast Refresh に委ねる（full-reload しない）。
- **`watchDir`（既定 `./src`）配下のその他** … ページ・ルート定義・Markdown など、クライアント HMR の
  境界を持たないものを含むため、変更時は SSR モジュールキャッシュを無効化してから **full-reload** する。

### 8.2 build（`cirro build`）

`runtime/build.ts` が 2 段で静的サイトを生成する。

1. **`vite build`** … 島マウンタのクライアントバンドルと `manifest.json` を生成（CSP 厳格設定はプラグインが注入済み）。
2. **各ルートを静的 HTML 化** … 一時的な SSR サーバで `routes` を評価し、`expandRoutes` が展開した
   全 URL について、島用 JS への `<script>` を併置して `renderToStaticMarkup` し、`dist/` に
   クリーン URL のパスで書き出す。

### 8.3 成果物

- 各ルートの `index.html`（本文は純粋な静的 HTML、マーカーなし）。
- 島用の外部 JS チャンク（`<script src>` で読まれる。インラインスクリプトなし）。
- 静的アセット（`public/` の内容、CSS など）。

---

## 9. Panda CSS によるデザイン（選択肢・非組み込み）

> **推奨スタイリングは Cirro 自前の CSS in JS（`css()`）に変わった**。設計・書き方・内部の仕組みは
> `05_STYLING.md` に集約している。Panda CSS は引き続き「非組み込みの選択肢」として利用できるが、
> 現在の標準は `05_STYLING.md` の自前 CSS である。本章は Panda CSS を使う場合の参考として残す。

Cirro は CSS フレームワークを**組み込んでいない**。Panda CSS もそのまま利用でき、`examples` の一部が実例
だった（現在の `examples/basic` / `examples/blog` は自前 CSS へ移行済み）。

### 9.1 なぜ相性が良いのか

Panda CSS は**ランタイム CSS-in-JS ではなく、ビルド時にソースを静的解析して外部 CSS を生成する**。
`css()` は事前計算済みのクラス名を返すだけで、実行時に `<style>` を注入しない。したがって生成物に
インライン `<style>` も `style=""` 属性も現れず、**`style-src 'self'` まで満たす厳格 CSP**を達成できる。
Cirro の「インラインを一切出さない」原則と方向性が一致する。

### 9.2 導入

```sh
bun add -d @pandacss/dev
bun panda init   # panda.config.ts を生成
```

`panda.config.ts` で、走査対象・トークン・レシピを定義する（`examples/blog` 抜粋）。

```ts
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
    preflight: true,                       // リセット CSS
    include: ["./src/**/*.{ts,tsx}"],      // 島も含め全ソースを走査して使用クラスのみ抽出
    outdir: "styled-system",               // 生成コードの出力先（Git 管理外でよい）
    jsxFramework: undefined,               // className に文字列を渡す方式
    theme: { extend: { tokens: { /* colors, radii, fonts ... */ }, recipes: { /* button, chip */ } } },
    globalCss: { "html, body": { /* ... */ } },
});
```

> フォントはシステムフォントスタックを使い、外部フォントへのリクエストを避ける
> （`style-src 'self'` / `font-src 'self'` を維持）。

### 9.3 dev / build スクリプトの組み方

Panda の CSS 生成（`cssgen`）を Cirro と並行させる。生成した CSS は `public/styles.css` に出力し、
レイアウトの `<head>` から `<link rel="stylesheet" href="/styles.css">` で読み込む。

```jsonc
{
    "scripts": {
        "prepare": "panda codegen",
        "dev": "concurrently -k -n css,cirro \"panda cssgen --watch -o public/styles.css\" \"cirro dev\"",
        "build": "panda cssgen --minify -o public/styles.css && tsc && cirro build",
        "preview": "vite preview"
    }
}
```

- `prepare` … 初回インストール後に `panda codegen` で `styled-system/` を生成。
- `dev` … `concurrently` で `panda cssgen --watch`（CSS 再生成）と `cirro dev` を同時起動。`.tsx` を
  保存すると Cirro が full-reload し、最新の `styles.css` が読み込まれる。
- `build` … CSS 生成 → 型チェック → 静的サイト生成。

`styled-system/` と `public/styles.css` は生成物なので `.gitignore` 対象にする。

### 9.4 スタイルの書き方

`css()`（任意スタイル）と `defineRecipe`（再利用するコンポーネントスタイル）を使う。

```tsx
import { css } from "../../styled-system/css";
import { button } from "../../styled-system/recipes";

<a className={button({ variant: "text" })}>Blog</a>
<footer className={css({ borderTop: "1px solid token(colors.border)", py: "6" })}>...</footer>
```

Markdown 本文のように、自分では要素を持たず HTML を流し込む箇所は、コンテナのクラスに**子孫セレクタ**で
スタイルを当てる（Prism のトークン配色もクラスベースで指定し、インライン style を出さない）。

```ts
const article = css({
    "& h2": { mt: "10", fontSize: "1.6rem", fontWeight: 700 },
    "& pre": { bg: "#0f172a", color: "#e2e8f0", p: "5", borderRadius: "card" },
    "& .token.keyword": { color: "#c084fc" }, // rehype-prism のトークンクラス
});
```

---

## 10. CSP（まとめ）

Cirro の生成物は、上記の仕組みにより **インラインスクリプトもインラインスタイルも含まない**
（Panda CSS を上記の通り使った場合）。そのため `unsafe-inline` なしの厳格な CSP で配信できる。

推奨ヘッダ例:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'
```

| CSP 条項 | 満たす仕組み |
| --- | --- |
| `script-src 'self'` | 島マウンタ・島コードはすべて外部 JS（`<script src>`）。props は `data-*` 属性で渡す（3 章・6 章） |
| `style-src 'self'` | 自前 CSS（`05_STYLING.md`）／Panda CSS（9 章）がビルド時に外部 CSS を生成。`<style>` も `style=""` も出さない |
| `font-src 'self'` | システムフォントスタックを使い外部フォントを読まない（9 章） |

---

## 付録

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（背景・目的・スコープ）
- `02_CLIENT_SCRIPT_BUNDLING.md` — クライアントスクリプトの配信・バンドルの現状調査
- `03_ISLAND_SYSTEM.md` — 島システムの使い方と内部の仕組み

### 用語

| 用語 | 意味 |
| --- | --- |
| 島（island） | 静的 HTML の中で、クライアントでインタラクティブに動く小領域 |
| ハイドレーション | サーバー出力の HTML を作り直さず、イベントと状態を後付けして動かすこと（`hydrateRoot`） |
| Config Base Routing | `routes.ts` に型付きオブジェクトでルートを宣言する方式 |
| 厳格 CSP | `unsafe-inline` を含まない Content Security Policy（`script-src 'self'` 等） |
| MPA | Multi-Page Application。各ページ独立の静的配信 |
