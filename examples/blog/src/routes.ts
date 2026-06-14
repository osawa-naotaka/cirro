import { type AnyRoute, route } from "cirro";
import { authors } from "./lib/authors";
import { allTags, posts } from "./lib/content";
import { AboutPage } from "./pages/about";
import { AuthorPage } from "./pages/author";
import { BlogIndexPage } from "./pages/blog-index";
import { HomePage } from "./pages/home";
import { PostPage } from "./pages/post";
import { TagIndexPage } from "./pages/tag-index";
import { TagPage } from "./pages/tag";

// サイトのルート定義（Config Base Routing）。
// 動的ルートは getStaticPaths でビルド対象の URL を列挙する。
export const routes: AnyRoute[] = [
    { path: "/", component: HomePage },
    { path: "/about", component: AboutPage },
    { path: "/blog", component: BlogIndexPage },
    { path: "/tags", component: TagIndexPage },
    route({
        path: ({ slug }) => `/blog/${slug}`,
        getStaticPaths: () => posts.map((p) => ({ slug: p.slug })),
        component: PostPage,
    }),
    route({
        path: ({ tag }) => `/tags/${tag}`,
        getStaticPaths: () => allTags().map(({ tag }) => ({ tag })),
        component: TagPage,
    }),
    route({
        path: ({ id }) => `/authors/${id}`,
        getStaticPaths: () => authors.map((a) => ({ id: a.id })),
        component: AuthorPage,
    }),
];
