import { type AnyRoute } from "cirrojs";
import { authors } from "./lib/authors";
import { allTags, posts } from "./lib/content";
import { AboutPage } from "./pages/about";
import { AuthorPage } from "./pages/author";
import { BlogIndexPage } from "./pages/blog-index";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { TagIndexPage } from "./pages/tag-index";
import { TagPage } from "./pages/tag";

// 自前スタイリングシステムのレジストリ関数を再 export する（必須）。
// ランタイムはこのモジュール経由で runWithRegistry を呼び、同一モジュールインスタンスの
// レジストリでレンダリングを包むことで、ルート単位の CSS を生成する。
export { runWithRegistry } from "cirrojs";

// サイトのルート定義（Config Base Routing）。
// 動的ルートは getStaticPaths でビルド対象の URL を列挙する。
// cssPath は CSS ファイルの URL（.css 終端）。動的ルートの全インスタンスで 1 つの CSS を共有し、
// 同一プレフィックスの静的ルート（/blog, /tags が生成する index.css）とは衝突しない名前にする。
export const routes: AnyRoute[] = [
    { type: "static", path: "/", component: HomePage },
    { type: "static", path: "/about", component: AboutPage },
    { type: "static", path: "/blog", component: BlogIndexPage },
    { type: "static", path: "/tags", component: TagIndexPage },
    {
        type: "dynamic",
        path: ({ slug }) => `/blog/${slug}`,
        cssPath: "/blog/post.css",
        getStaticPaths: () => posts.map(({ slug }) => ({ slug })),
        component: PostPage,
    },
    {
        type: "dynamic",
        path: ({ tag }) => `/tags/${tag}`,
        cssPath: "/tags/tag.css",
        getStaticPaths: () => allTags().map(({ tag }) => ({ tag })),
        component: TagPage,
    },
    {
        type: "dynamic",
        path: ({ id }) => `/authors/${id}`,
        cssPath: "/authors/index.css",
        getStaticPaths: () => authors.map(({ id }) => ({ id })),
        component: AuthorPage,
    },
];
