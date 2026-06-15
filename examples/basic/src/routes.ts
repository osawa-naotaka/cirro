import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { type AnyRoute, route } from "cirro";

// サイトのルート定義（Config Base Routing）。
export const routes: AnyRoute[] = [
    { path: "/", component: HomePage },
    { path: "/about", component: AboutPage },
    route({
        path: ({ slug }) => `/posts/${slug}`,
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    }),
];
