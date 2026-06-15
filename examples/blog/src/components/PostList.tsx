import { css } from "../../styled-system/css";
import type { Post } from "../lib/types";
import { PostCard } from "./PostCard";

// 記事カードの縦並びリスト。空のときはメッセージを表示する。
export function PostList({ posts, empty = "記事がありません。" }: { posts: Post[]; empty?: string }) {
    if (posts.length === 0) {
        return <p className={css({ color: "fg.muted", py: "8" })}>{empty}</p>;
    }
    return (
        <div className={css({ display: "flex", flexDir: "column", gap: "5" })}>
            {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
            ))}
        </div>
    );
}
