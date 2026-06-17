import type { Post } from "../lib/types";
import { color, cssMain, cx, fontSize, radii, shadow, space } from "../styles/system";
import { PostMeta } from "./PostMeta";

// 一覧で使う記事カード。タイトルと要約をクリックで記事へ、著者・タグは個別リンク。
export function PostCard({ post }: { post: Post }) {
    return (
        <article
            className={cx(
                cssMain({
                    background_color: color.surface,
                    border: `1px solid ${color.border}`,
                    border_radius: radii.card,
                    overflow: "hidden",
                    transition: "box-shadow .2s",
                }),
                cssMain({ box_shadow: shadow.md }, { selector: "&:hover" }),
            )}
        >
            <a
                href={`/blog/${post.slug}`}
                className={cx(
                    cssMain({ display: "block", padding: space(4), color: "inherit", text_decoration: "none" }),
                    cssMain({ background_color: color.hover }, { selector: "&:hover" }),
                )}
            >
                <h2 className={cssMain({ font_size: fontSize.lg, font_weight: "700", margin_bottom: space(1) })}>{post.title}</h2>
                <p className={cssMain({ font_size: fontSize.sm, color: color.fgMuted })}>{post.description}</p>
            </a>
            <div className={cssMain({ padding_left: space(4), padding_right: space(4), padding_bottom: space(4) })}>
                <PostMeta post={post} />
            </div>
        </article>
    );
}
