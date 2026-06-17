import { Layout } from "../components/Layout";
import { PostMeta } from "../components/PostMeta";
import { TableOfContents } from "../components/TableOfContents";
import { getAuthor } from "../lib/authors";
import { getPost } from "../lib/content";
import { renderMarkdown } from "../lib/markdown";
import { articleClass } from "../styles/article";
import { color, cssMain, cssMd, cx, fontSize, radii, space } from "../styles/system";

// ブログ個別記事ページ（/blog/[slug]）。
export function PostPage({ params }: { params: { slug: string } }) {
    const post = getPost(params.slug);

    if (!post) {
        return (
            <Layout title="記事が見つかりません — Cirro Blog" island={false}>
                <h1 className={cssMain({ font_size: "2rem", font_weight: "700", margin_bottom: space(4) })}>記事が見つかりません</h1>
                <a href="/blog" className={cssMain({ color: color.primary })}>
                    ← 記事一覧へ
                </a>
            </Layout>
        );
    }

    const author = getAuthor(post.author);
    const crumbLink = cx(
        cssMain({ color: color.fgMuted, text_decoration: "none" }),
        cssMain({ text_decoration: "underline" }, { selector: "&:hover" }),
    );
    // 本文（renderMarkdown が返すサニタイズ済み HTML）のコンテナクラスを生成する。
    const article = articleClass();
    // 本文を 1 パスでサニタイズ済み HTML（body）と目次（toc）に変換する。
    const { body, toc } = renderMarkdown(post.content, { className: article });

    return (
        <Layout title={`${post.title} — Cirro Blog`} description={post.description}>
            <nav className={cssMain({ display: "flex", align_items: "center", gap: space(2), font_size: fontSize.sm, margin_bottom: space(6) })}>
                <a href="/blog" className={crumbLink}>
                    記事一覧
                </a>
                <span className={cssMain({ color: color.fgMuted })}>/</span>
                <span className={cssMain({ color: color.fg, overflow: "hidden", text_overflow: "ellipsis", white_space: "nowrap", max_width: space(60) })}>{post.title}</span>
            </nav>

            <article>
                <h1 className={cx(cssMain({ font_size: "1.9rem", font_weight: "700", margin_bottom: space(4), line_height: "1.3" }), cssMd({ font_size: "2.5rem" }))}>{post.title}</h1>
                <div className={cssMain({ margin_bottom: space(8) })}>
                    <PostMeta post={post} size="medium" />
                </div>

                <hr className={cssMain({ border: "0", border_top: `1px solid ${color.border}`, margin_bottom: space(8) })} />

                <TableOfContents toc={toc} />

                {body}
            </article>

            <hr className={cssMain({ border: "0", border_top: `1px solid ${color.border}`, margin_top: space(10), margin_bottom: space(10) })} />

            <div className={cssMain({ border: `1px solid ${color.border}`, border_radius: radii.panel, padding: space(6) })}>
                <div className={cssMain({ display: "flex", align_items: "center", gap: space(4) })}>
                    <a
                        href={`/authors/${author.id}`}
                        className={cssMain({
                            flex_shrink: "0",
                            width: space(14),
                            height: space(14),
                            border_radius: radii.full,
                            background_color: color.primary,
                            color: color.white,
                            display: "flex",
                            align_items: "center",
                            justify_content: "center",
                            font_size: fontSize.xl,
                            text_decoration: "none",
                        })}
                    >
                        {author.name.charAt(0)}
                    </a>
                    <div>
                        <p className={cssMain({ font_size: fontSize.xs, color: color.fgMuted, text_transform: "uppercase", letter_spacing: "0.05em" })}>この記事を書いた人</p>
                        <p className={cssMain({ font_size: fontSize.lg, font_weight: "700" })}>
                            <a
                                href={`/authors/${author.id}`}
                                className={cx(
                                    cssMain({ color: "inherit", text_decoration: "none" }),
                                    cssMain({ text_decoration: "underline" }, { selector: "&:hover" }),
                                )}
                            >
                                {author.name}
                            </a>
                        </p>
                        <p className={cssMain({ font_size: fontSize.sm, color: color.fgMuted })}>{author.bio}</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
