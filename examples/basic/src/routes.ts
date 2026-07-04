import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { defineRoutes } from "cirrojs";

export { runWithRegistry } from "cirrojs";

// サイトのルート定義（Config Base Routing）。
export default defineRoutes(
    { type: "static", path: "/index.html", component: HomePage },
    { type: "static", path: "/about.html", component: AboutPage },
    {
        type: "dynamic",
        path: ({ slug }) => `/posts/${slug}.html`,
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    },
);
