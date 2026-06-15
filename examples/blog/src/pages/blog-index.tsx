import { css } from "../../styled-system/css";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { posts } from "../lib/content";

// ブログインデックス: 全記事を新しい順に一覧表示。
export function BlogIndexPage() {
    return (
        <Layout title="記事一覧 — Cirro Blog" description="Cirro Blog の全記事一覧。">
            <h1 className={css({ fontSize: "2rem", fontWeight: 700, mb: "1" })}>記事一覧</h1>
            <p className={css({ color: "fg.muted", mb: "8" })}>全 {posts.length} 件</p>
            <PostList posts={posts} />
        </Layout>
    );
}
