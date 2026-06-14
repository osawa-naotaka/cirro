import { Avatar, Box, Breadcrumbs, Divider, Link, Paper, Stack, Typography } from "@mui/material";
import { ArticleBody } from "../components/ArticleBody";
import { Layout } from "../components/Layout";
import { PostMeta } from "../components/PostMeta";
import { getAuthor } from "../lib/authors";
import { getPost } from "../lib/content";

// ブログ個別記事ページ（/blog/[slug]）。
export function PostPage({ params }: { params: { slug: string } }) {
    const post = getPost(params.slug);

    if (!post) {
        return (
            <Layout title="記事が見つかりません — Cirro Blog" island={false}>
                <Typography variant="h4" component="h1">
                    記事が見つかりません
                </Typography>
                <Link href="/blog">← 記事一覧へ</Link>
            </Layout>
        );
    }

    const author = getAuthor(post.author);

    return (
        <Layout title={`${post.title} — Cirro Blog`} description={post.description}>
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link href="/blog" underline="hover" color="inherit">
                    記事一覧
                </Link>
                <Typography color="text.primary" noWrap sx={{ maxWidth: 240 }}>
                    {post.title}
                </Typography>
            </Breadcrumbs>

            <Box component="article">
                <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.3 }}>
                    {post.title}
                </Typography>
                <Box sx={{ mb: 4 }}>
                    <PostMeta post={post} size="medium" />
                </Box>

                <Divider sx={{ mb: 4 }} />

                <ArticleBody html={post.html} />
            </Box>

            <Divider sx={{ my: 5 }} />

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                        component="a"
                        href={`/authors/${author.id}`}
                        sx={{ width: 56, height: 56, bgcolor: "primary.main", textDecoration: "none" }}
                    >
                        {author.name.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="overline" color="text.secondary">
                            この記事を書いた人
                        </Typography>
                        <Typography variant="h6" component="p">
                            <Link href={`/authors/${author.id}`} underline="hover" color="inherit">
                                {author.name}
                            </Link>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {author.bio}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>
        </Layout>
    );
}
