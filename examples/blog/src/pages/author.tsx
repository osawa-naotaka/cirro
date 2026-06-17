import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { getAuthor } from "../lib/authors";
import { postsByAuthor } from "../lib/content";
import { color, cssMain, cssMd, cssSm, cx, fontSize, radii, space } from "../styles/system";

// 著者ページ（/authors/[id]）: プロフィール + 執筆記事。
export function AuthorPage({ params }: { params: { id: string } }) {
    const author = getAuthor(params.id);
    const written = postsByAuthor(author.id);

    return (
        <Layout title={`${author.name} — Cirro Blog`} description={author.bio}>
            <div
                className={cx(
                    cssMain({ border: `1px solid ${color.border}`, border_radius: radii.panel, padding: space(6), margin_bottom: space(10) }),
                    cssMd({ padding: space(8) }),
                )}
            >
                <div className={cx(cssMain({ display: "flex", flex_direction: "column", gap: space(6) }), cssSm({ flex_direction: "row", align_items: "center" }))}>
                    <div
                        className={cssMain({
                            flex_shrink: "0",
                            width: space(18),
                            height: space(18),
                            border_radius: radii.full,
                            background_color: color.primary,
                            color: color.white,
                            display: "flex",
                            align_items: "center",
                            justify_content: "center",
                            font_size: "1.75rem",
                        })}
                    >
                        {author.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className={cssMain({ font_size: "2rem", font_weight: "700" })}>{author.name}</h1>
                        <p className={cssMain({ color: color.primary, margin_bottom: space(1) })}>{author.role}</p>
                        <p className={cssMain({ color: color.fgMuted })}>{author.bio}</p>
                    </div>
                </div>
            </div>

            <h2 className={cssMain({ font_size: fontSize.xl, font_weight: "700", margin_bottom: space(4) })}>
                {author.name} の記事（{written.length} 件）
            </h2>
            <PostList posts={written} empty="まだ記事がありません。" />
        </Layout>
    );
}
