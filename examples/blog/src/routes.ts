import { createRouteFn, sitemapXml } from "cirrojs";
import { content } from "./content";
import { authors } from "./lib/authors";
import { allTags } from "./lib/content";
import { AboutPage } from "./pages/about";
import { AuthorPage } from "./pages/author";
import { BlogIndexPage } from "./pages/blog-index";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { rssFeed } from "./pages/rss";
import { generateSearchIndex } from "./pages/search-index";
import { TagPage } from "./pages/tag";
import { TagIndexPage } from "./pages/tag-index";
import { site } from "./site";

// 自前スタイリングシステムのレジストリ関数を再 export する（必須）。
// ランタイムはこのモジュール経由で runWithRegistry を呼び、同一モジュールインスタンスの
// レジストリでレンダリングを包むことで、ルート単位の CSS を生成する。
export { runWithRegistry } from "cirrojs";

const { defineRoutes, route } = createRouteFn({ content, site });

// サイトのルート定義（Config Base Routing）。
// 動的ルートは getStaticPaths でビルド対象の URL を列挙する。
// cssPath は CSS ファイルの URL（.css 終端）。動的ルートの全インスタンスで 1 つの CSS を共有し、
// 同一プレフィックスの静的ルート（/blog, /tags が生成する index.css）とは衝突しない名前にする。
export default defineRoutes(
    route({ type: "static", path: "/index.html", component: HomePage }),
    route({ type: "static", path: "/about.html", component: AboutPage }),
    route({ type: "static", path: "/blog/index.html", component: BlogIndexPage }),
    route({ type: "static", path: "/tags/index.html", component: TagIndexPage }),
    route({
        type: "dynamic",
        path: ({ slug }) => `/blog/${slug}.html`,
        getStaticPaths: (content) => content.posts.map(({ slug }) => ({ slug })),
        component: PostPage,
    }),
    route({
        type: "dynamic",
        path: ({ tag }) => `/tags/${tag}.html`,
        getStaticPaths: (content) => allTags(content.posts).map(({ tag }) => ({ tag })),
        component: TagPage,
    }),
    route({
        type: "dynamic",
        path: ({ id }) => `/authors/${id}.html`,
        getStaticPaths: () => authors.map(({ id }) => ({ id })),
        component: AuthorPage,
    }),
    route({
        type: "file",
        path: "/search-index.json",
        component: generateSearchIndex,
    }),
    route({
        type: "file",
        path: "/sitemap.xml",
        component: sitemapXml(),
    }),
    route({
        type: "file",
        path: "/rss.xml",
        component: rssFeed,
    }),
);
