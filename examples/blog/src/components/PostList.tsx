import type { Post } from "../lib/types";
import { stack } from "../styles/layout";
import { color, cssMain, space } from "../styles/system";
import { PostCard } from "./PostCard";

// 記事カードの縦並びリスト。空のときはメッセージを表示する。
export function PostList({ posts, empty = "記事がありません。" }: { posts: Post[]; empty?: string }) {
    if (posts.length === 0) {
        return <p className={cssMain({ color: color.fgMuted, padding_top: space(8), padding_bottom: space(8) })}>{empty}</p>;
    }
    return (
        <div className={stack({ gap: space(5) })}>
            {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
            ))}
        </div>
    );
}
