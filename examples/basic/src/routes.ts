import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { createRoute } from "cirrojs";

export { runWithRegistry } from "cirrojs";

const { defineRoutes, staticRoute, dynamicRoute } = createRoute();

// サイトのルート定義（Config Base Routing）。
export default defineRoutes(
    staticRoute({ path: "/index.html", component: HomePage }),
    staticRoute({ path: "/about.html", component: AboutPage }),
    dynamicRoute({
        path: ({ slug }) => `/posts/${slug}.html`,
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    }),
);
