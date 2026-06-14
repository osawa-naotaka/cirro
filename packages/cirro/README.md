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
import { cirro } from "cirro/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [cirro({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" })],
});
```

```jsonc
// package.json
"scripts": { "dev": "cirro dev", "build": "cirro build" }
```

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

## ライセンス

MIT
