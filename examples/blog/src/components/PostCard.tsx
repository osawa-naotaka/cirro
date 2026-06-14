import { css } from "../../styled-system/css";
import type { Post } from "../lib/types";
import { PostMeta } from "./PostMeta";

// 一覧で使う記事カード。タイトルと要約をクリックで記事へ、著者・タグは個別リンク。
export function PostCard({ post }: { post: Post }) {
    return (
        <article
            className={css({
                bg: "surface",
                border: "1px solid token(colors.border)",
                borderRadius: "card",
                overflow: "hidden",
                transition: "box-shadow .2s",
                _hover: { boxShadow: "md" },
            })}
        >
            <a
                href={`/blog/${post.slug}`}
                className={css({ display: "block", p: "4", color: "inherit", textDecoration: "none", _hover: { bg: "hover" } })}
            >
                <h2 className={css({ fontSize: "lg", fontWeight: 700, mb: "1" })}>{post.title}</h2>
                <p className={css({ fontSize: "sm", color: "fg.muted" })}>{post.description}</p>
            </a>
            <div className={css({ px: "4", pb: "4" })}>
                <PostMeta post={post} />
            </div>
        </article>
    );
}
