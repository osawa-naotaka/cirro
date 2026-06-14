import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { postsByTag } from "../lib/content";

// タグ別の記事一覧（/tags/[tag]）。
export function TagPage({ params }: { params: { tag: string } }) {
    const { tag } = params;
    const tagged = postsByTag(tag);

    return (
        <Layout title={`#${tag} の記事 — Cirro Blog`} description={`タグ「${tag}」が付いた記事一覧。`}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link href="/tags" underline="hover" color="inherit">
                    タグ一覧
                </Link>
                <Typography color="text.primary">#{tag}</Typography>
            </Breadcrumbs>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                #{tag}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                {tagged.length} 件の記事
            </Typography>
            <PostList posts={tagged} empty="このタグの記事はまだありません。" />
        </Layout>
    );
}
