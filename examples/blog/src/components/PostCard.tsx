import { Card, CardActionArea, CardContent, Link, Stack, Typography } from "@mui/material";
import type { Post } from "../lib/types";
import { PostMeta } from "./PostMeta";

// 一覧で使う記事カード。タイトルと要約をクリックで記事へ、著者・タグは個別リンク。
export function PostCard({ post }: { post: Post }) {
    return (
        <Card variant="outlined" sx={{ transition: "box-shadow .2s", "&:hover": { boxShadow: 3 } }}>
            <CardActionArea component={Link} href={`/blog/${post.slug}`}>
                <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                        {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {post.description}
                    </Typography>
                </CardContent>
            </CardActionArea>
            <CardContent sx={{ pt: 0 }}>
                <Stack spacing={1}>
                    <PostMeta post={post} />
                </Stack>
            </CardContent>
        </Card>
    );
}
