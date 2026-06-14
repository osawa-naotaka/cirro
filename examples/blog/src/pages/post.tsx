import { css } from "../../styled-system/css";
import { ArticleBody } from "../components/ArticleBody";
import { Layout } from "../components/Layout";
import { PostMeta } from "../components/PostMeta";
import { getAuthor } from "../lib/authors";
import { getPost } from "../lib/content";

const hr = css({ border: "0", borderTop: "1px solid token(colors.border)", my: "10" });
const crumbLink = css({ color: "fg.muted", textDecoration: "none", _hover: { textDecoration: "underline" } });

// ブログ個別記事ページ（/blog/[slug]）。
export function PostPage({ params }: { params: { slug: string } }) {
    const post = getPost(params.slug);

    if (!post) {
        return (
            <Layout title="記事が見つかりません — Cirro Blog" island={false}>
                <h1 className={css({ fontSize: "2rem", fontWeight: 700, mb: "4" })}>記事が見つかりません</h1>
                <a href="/blog" className={css({ color: "primary" })}>
                    ← 記事一覧へ
                </a>
            </Layout>
        );
    }

    const author = getAuthor(post.author);

    return (
        <Layout title={`${post.title} — Cirro Blog`} description={post.description}>
            <nav className={css({ display: "flex", alignItems: "center", gap: "2", fontSize: "sm", mb: "6" })}>
                <a href="/blog" className={crumbLink}>
                    記事一覧
                </a>
                <span className={css({ color: "fg.muted" })}>/</span>
                <span className={css({ color: "fg", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxW: "60" })}>{post.title}</span>
            </nav>

            <article>
                <h1 className={css({ fontSize: { base: "1.9rem", md: "2.5rem" }, fontWeight: 700, mb: "4", lineHeight: 1.3 })}>{post.title}</h1>
                <div className={css({ mb: "8" })}>
                    <PostMeta post={post} size="medium" />
                </div>

                <hr className={css({ border: "0", borderTop: "1px solid token(colors.border)", mb: "8" })} />

                <ArticleBody html={post.html} />
            </article>

            <hr className={hr} />

            <div className={css({ border: "1px solid token(colors.border)", borderRadius: "panel", p: "6" })}>
                <div className={css({ display: "flex", alignItems: "center", gap: "4" })}>
                    <a
                        href={`/authors/${author.id}`}
                        className={css({
                            flexShrink: 0,
                            w: "14",
                            h: "14",
                            borderRadius: "full",
                            bg: "primary",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "xl",
                            textDecoration: "none",
                        })}
                    >
                        {author.name.charAt(0)}
                    </a>
                    <div>
                        <p className={css({ fontSize: "xs", color: "fg.muted", textTransform: "uppercase", letterSpacing: "wider" })}>この記事を書いた人</p>
                        <p className={css({ fontSize: "lg", fontWeight: 700 })}>
                            <a href={`/authors/${author.id}`} className={css({ color: "inherit", textDecoration: "none", _hover: { textDecoration: "underline" } })}>
                                {author.name}
                            </a>
                        </p>
                        <p className={css({ fontSize: "sm", color: "fg.muted" })}>{author.bio}</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
