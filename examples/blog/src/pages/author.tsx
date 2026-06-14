import { Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { getAuthor } from "../lib/authors";
import { postsByAuthor } from "../lib/content";

// 著者ページ（/authors/[id]）: プロフィール + 執筆記事。
export function AuthorPage({ params }: { params: { id: string } }) {
    const author = getAuthor(params.id);
    const written = postsByAuthor(author.id);

    return (
        <Layout title={`${author.name} — Cirro Blog`} description={author.bio}>
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, mb: 5, borderRadius: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }}>
                    <Avatar sx={{ width: 72, height: 72, bgcolor: "primary.main", fontSize: 28 }}>
                        {author.name.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                            {author.name}
                        </Typography>
                        <Typography color="primary" sx={{ mb: 1 }}>
                            {author.role}
                        </Typography>
                        <Typography color="text.secondary">{author.bio}</Typography>
                    </Box>
                </Stack>
            </Paper>

            <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                {author.name} の記事（{written.length} 件）
            </Typography>
            <PostList posts={written} empty="まだ記事がありません。" />
        </Layout>
    );
}
