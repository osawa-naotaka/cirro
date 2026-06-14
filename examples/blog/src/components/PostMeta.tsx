import { css } from "../../styled-system/css";
import { chip } from "../../styled-system/recipes";
import { getAuthor } from "../lib/authors";
import { formatDate } from "../lib/format";
import type { Post } from "../lib/types";

// 記事のメタ情報（著者・日付・タグ）を表示する共通行。
// size="small" で一覧用、size="medium" で記事ヘッダ用に使い分ける。
export function PostMeta({ post, size = "small" }: { post: Post; size?: "small" | "medium" }) {
    const author = getAuthor(post.author);
    const labelClass = css({ color: "fg.muted", fontSize: size === "medium" ? "sm" : "xs" });

    return (
        <div className={css({ display: "flex", flexDir: "column", gap: "2" })}>
            <div className={css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3" })}>
                <span className={labelClass}>
                    <a href={`/authors/${author.id}`} className={css({ color: "inherit", textDecoration: "none", _hover: { textDecoration: "underline" } })}>
                        {author.name}
                    </a>
                </span>
                <span className={labelClass}>・</span>
                <time className={labelClass}>{formatDate(post.date)}</time>
            </div>

            {post.tags.length > 0 ? (
                <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5" })}>
                    {post.tags.map((tag) => (
                        <a key={tag} href={`/tags/${tag}`} className={chip()}>
                            {tag}
                        </a>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
