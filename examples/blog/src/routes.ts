import { defineRoutes, staticRoute, dynamicRoute, fileRoute } from "cirrojs";
import { authors } from "./lib/authors";
import { allTags, posts } from "./lib/content";
import { AboutPage } from "./pages/about";
import { AuthorPage } from "./pages/author";
import { BlogIndexPage } from "./pages/blog-index";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { TagIndexPage } from "./pages/tag-index";
import { TagPage } from "./pages/tag";
import { genearteSearchIndex } from "./pages/search-index";

// 自前スタイリングシステムのレジストリ関数を再 export する（必須）。
// ランタイムはこのモジュール経由で runWithRegistry を呼び、同一モジュールインスタンスの
// レジストリでレンダリングを包むことで、ルート単位の CSS を生成する。
export { runWithRegistry } from "cirrojs";

// サイトのルート定義（Config Base Routing）。
// 動的ルートは getStaticPaths でビルド対象の URL を列挙する。
// cssPath は CSS ファイルの URL（.css 終端）。動的ルートの全インスタンスで 1 つの CSS を共有し、
// 同一プレフィックスの静的ルート（/blog, /tags が生成する index.css）とは衝突しない名前にする。
export default defineRoutes(
    staticRoute({ path: "/index.html", component: HomePage }),
    staticRoute({ path: "/about.html", component: AboutPage }),
    staticRoute({ path: "/blog/index.html", component: BlogIndexPage }),
    staticRoute({ path: "/tags/index.html", component: TagIndexPage }),
    dynamicRoute({
        path: ({ slug }) => `/blog/${slug}.html`,
        getStaticPaths: () => posts.map(({ slug }) => ({ slug })),
        component: PostPage,
    }),
    dynamicRoute({
        path: ({ tag }) => `/tags/${tag}.html`,
        getStaticPaths: () => allTags().map(({ tag }) => ({ tag })),
        component: TagPage,
    }),
    dynamicRoute({
        path: ({ id }) => `/authors/${id}.html`,
        getStaticPaths: () => authors.map(({ id }) => ({ id })),
        component: AuthorPage,
    }),
    fileRoute({
        path: "/search-index.json",
        component: genearteSearchIndex,
    }),
);
