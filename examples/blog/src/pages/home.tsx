import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { allTags, posts } from "../lib/content";

// ホームページ: ヒーロー + 最新記事 + 人気タグ。
export function HomePage() {
    const recent = posts.slice(0, 3);
    const tags = allTags().slice(0, 8);

    return (
        <Layout
            title="Cirro Blog — セキュリティ第一の軽量 SSG"
            description="React の島アーキテクチャと厳格な CSP を実現する軽量 SSG「Cirro」の公式サンプルブログ。"
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, md: 5 },
                    mb: 5,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #1565c0 0%, #00897b 100%)",
                    color: "#fff",
                }}
            >
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                    Cirro Blog
                </Typography>
                <Typography variant="h6" component="p" sx={{ fontWeight: 400, opacity: 0.95, mb: 3 }}>
                    インラインスクリプトを一切生成せず、<code>script-src 'self'</code> の厳格な CSP を満たす。
                    React だけで書ける、軽量な静的サイトジェネレーター。
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Button href="/blog" variant="contained" color="inherit" sx={{ color: "primary.main" }}>
                        記事を読む
                    </Button>
                    <Button href="/about" variant="outlined" color="inherit">
                        Cirro について
                    </Button>
                </Stack>
            </Paper>

            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                    最新の記事
                </Typography>
                <Button href="/blog" size="small">
                    すべて見る
                </Button>
            </Stack>
            <PostList posts={recent} />

            <Divider sx={{ my: 5 }} />

            <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                タグから探す
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {tags.map(({ tag, count }) => (
                    <Chip
                        key={tag}
                        label={`${tag} (${count})`}
                        component="a"
                        href={`/tags/${tag}`}
                        clickable
                        color="primary"
                        variant="outlined"
                    />
                ))}
            </Box>
        </Layout>
    );
}
