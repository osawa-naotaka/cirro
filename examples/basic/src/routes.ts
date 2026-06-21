import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { type AnyRoute, route } from "cirrojs";
export { runWithRegistry } from "cirrojs";

// サイトのルート定義（Config Base Routing）。
export const routes: AnyRoute[] = [
    { type: "static", path: "/", component: HomePage },
    { type: "static", path: "/about", component: AboutPage },
    route({
        type: "dynamic",
        path: ({ slug }) => `/posts/${slug}`,
        cssPath: "/posts/index.css",
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    }),
];
