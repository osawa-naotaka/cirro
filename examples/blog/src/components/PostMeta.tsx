import { Box, Chip, Link, Stack, Typography } from "@mui/material";
import { getAuthor } from "../lib/authors";
import { formatDate } from "../lib/format";
import type { Post } from "../lib/types";

// 記事のメタ情報（著者・日付・タグ）を表示する共通行。
// size="small" で一覧用、size="medium" で記事ヘッダ用に使い分ける。
export function PostMeta({ post, size = "small" }: { post: Post; size?: "small" | "medium" }) {
    const author = getAuthor(post.author);
    const labelVariant = size === "medium" ? "body2" : "caption";

    return (
        <Stack spacing={1}>
            <Stack direction="row" spacing={1.5} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography variant={labelVariant} color="text.secondary">
                    <Link href={`/authors/${author.id}`} underline="hover" color="inherit">
                        {author.name}
                    </Link>
                </Typography>
                <Typography variant={labelVariant} color="text.secondary">
                    ・
                </Typography>
                <Typography variant={labelVariant} color="text.secondary" component="time">
                    {formatDate(post.date)}
                </Typography>
            </Stack>

            {post.tags.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {post.tags.map((tag) => (
                        <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            color="primary"
                            component="a"
                            href={`/tags/${tag}`}
                            clickable
                        />
                    ))}
                </Box>
            ) : null}
        </Stack>
    );
}
