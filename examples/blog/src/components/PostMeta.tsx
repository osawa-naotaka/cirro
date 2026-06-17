import { getAuthor } from "../lib/authors";
import { formatDate } from "../lib/format";
import type { Post } from "../lib/types";
import { chip } from "../styles/recipes";
import { color, cssMain, cx, fontSize, space } from "../styles/system";

// 記事のメタ情報（著者・日付・タグ）を表示する共通行。
// size="small" で一覧用、size="medium" で記事ヘッダ用に使い分ける。
export function PostMeta({ post, size = "small" }: { post: Post; size?: "small" | "medium" }) {
    const author = getAuthor(post.author);
    const labelClass = cssMain({ color: color.fgMuted, font_size: size === "medium" ? fontSize.sm : fontSize.xs });

    return (
        <div className={cssMain({ display: "flex", flex_direction: "column", gap: space(2) })}>
            <div className={cssMain({ display: "flex", flex_wrap: "wrap", align_items: "center", gap: space(3) })}>
                <span className={labelClass}>
                    <a
                        href={`/authors/${author.id}`}
                        className={cx(
                            cssMain({ color: "inherit", text_decoration: "none" }),
                            cssMain({ text_decoration: "underline" }, { selector: "&:hover" }),
                        )}
                    >
                        {author.name}
                    </a>
                </span>
                <span className={labelClass}>・</span>
                <time className={labelClass}>{formatDate(post.date)}</time>
            </div>

            {post.tags.length > 0 ? (
                <div className={cssMain({ display: "flex", flex_wrap: "wrap", gap: space(1.5) })}>
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
