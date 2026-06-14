import { Stack, Typography } from "@mui/material";
import type { Post } from "../lib/types";
import { PostCard } from "./PostCard";

// 記事カードの縦並びリスト。空のときはメッセージを表示する。
export function PostList({ posts, empty = "記事がありません。" }: { posts: Post[]; empty?: string }) {
    if (posts.length === 0) {
        return (
            <Typography color="text.secondary" sx={{ py: 4 }}>
                {empty}
            </Typography>
        );
    }
    return (
        <Stack spacing={2.5}>
            {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
            ))}
        </Stack>
    );
}
