import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { createRouteFn } from "cirrojs";

export { runWithRegistry } from "cirrojs";

const { defineRoutes, route } = createRouteFn();

// サイトのルート定義（Config Base Routing）。
export default defineRoutes(
    route({ type: "static", path: "/index.html", component: HomePage }),
    route({ type: "static", path: "/about.html", component: AboutPage }),
    route({
        type: "dynamic",
        path: ({ slug }) => `/posts/${slug}.html`,
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    },
));
