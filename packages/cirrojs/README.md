# cirro

React の島（islands）アーキテクチャによる、CSP 厳格（`unsafe-inline` 不要）を実現する軽量 static site generator。

## 特徴

- **インラインスクリプトを一切生成しない** → `script-src 'self'` の厳格な CSP で動作する（Astro 等が残しがちな少量のインラインを排除）
- 本文は**純粋な静的 HTML**、インタラクティブな箇所だけを**島**としてハイドレート（MPA）
- **Config Base Routing**: `.ts` に型付きオブジェクトでルート定義。動的ルートは `params → URL` の関数 + `getStaticPaths`
- **React のみ**（独自テンプレート構文の学習が不要）

## 使い方

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { cirro } from "cirro/vite";
import { defineConfig } from "vite";

// React プラグインは利用者が明示的に追加する（cirro は内包しない）。
export default defineConfig({
    plugins: [react(), cirro({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" })],
});
```

```jsonc
// package.json
"scripts": { "dev": "cirro dev", "build": "tsc && cirro build", "preview": "vite preview" }
```

CLI は `cirro dev`（SSR + ルーティング + HMR の開発サーバー）と `cirro build`（静的サイトを `dist/` へ生成）の 2 つ。プレビューは `vite preview` を使う。

```ts
// src/islands/registry.ts — 島を登録（純データ）
import { Counter } from "./Counter";
export const islands = { counter: Counter } as const;
```

```ts
// src/islands/Island.ts — 型安全な <Island> を生成
import { createIsland } from "cirro";
import { islands } from "./registry";
export const Island = createIsland(islands);
```

```tsx
// src/routes.ts — ルート定義
import { route, type AnyRoute } from "cirro";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";

export const routes: AnyRoute[] = [
    { path: "/", component: HomePage },
    route({
        path: ({ slug }) => `/posts/${slug}`,
        getStaticPaths: () => [{ slug: "hello" }],
        component: PostPage,
    }),
];
```

ページは完全な HTML 文書を返し、島は `<Island name="counter" props={{ initial: 3 }} />` のように型安全に配置する。

## Markdown

`createMarkdown()` でビルド時に Markdown を HTML 化する。`rehype-sanitize` を固定で強制し（ユーザープラグインは「サニタイズの上流」に積む）、目次抽出（`toc`）やクラスベースのシンタックスハイライト（`highlight`、インラインスタイルを出さず `style-src 'self'` と両立）に対応する。unified 一式はクライアントへ送られない。

```ts
import { createMarkdown } from "cirro";
import remarkGfm from "remark-gfm";

const { render } = createMarkdown({ remarkPlugins: [remarkGfm], toc: true, highlight: true });
const { body, toc } = render(markdownSource); // body: サニタイズ済み HTML の React 要素 / toc: 目次
```

## ドキュメント

使い方の詳細は [`doc/04_USAGE.md`](../../doc/04_USAGE.md) を参照（セットアップ、ルーティング、dev / build、島、Markdown、Panda CSS によるデザイン、CSP まで網羅）。島システムの仕組みは [`doc/03_ISLAND_SYSTEM.md`](../../doc/03_ISLAND_SYSTEM.md)、設計の背景は [`doc/01_CHARTER.md`](../../doc/01_CHARTER.md) を参照。

## ライセンス

MIT
