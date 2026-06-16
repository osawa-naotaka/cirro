import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { type AnyRoute, route } from "cirrojs";

// サイトのルート定義（Config Base Routing）。
export const routes: AnyRoute[] = [
    { path: "/", component: HomePage },
    { path: "/about", component: AboutPage },
    route({
        path: ({ slug }) => `/posts/${slug}`,
        cssPath: "/posts/index.css",
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    }),
];
