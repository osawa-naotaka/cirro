import { createRouteFn } from "cirrojs";
import { Page } from "./pages/page";

export { runWithRegistry } from "cirrojs";

const { defineRoutes, route } = createRouteFn();

// ルート展開後の検査（重複・パス形式・public 衝突）に引っかかる定義。
export default defineRoutes(
    route({ type: "static", path: "/index.html", component: Page }),
    // malformed-path: html ルートなのに .html で終わっていない
    route({ type: "static", path: "/about", component: Page }),
    // public 衝突: public/collide.html と同じ URL を生成する
    route({ type: "static", path: "/collide.html", component: Page }),
    // duplicate: 同じ slug を 2 回返す動的ルート
    route({
        type: "dynamic",
        path: ({ slug }: { slug: string }) => `/posts/${slug}.html`,
        getStaticPaths: () => [{ slug: "dup" }, { slug: "dup" }],
        component: Page,
    }),
);
