import { Typography } from "@mui/material";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { posts } from "../lib/content";

// ブログインデックス: 全記事を新しい順に一覧表示。
export function BlogIndexPage() {
    return (
        <Layout title="記事一覧 — Cirro Blog" description="Cirro Blog の全記事一覧。">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                記事一覧
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                全 {posts.length} 件
            </Typography>
            <PostList posts={posts} />
        </Layout>
    );
}
