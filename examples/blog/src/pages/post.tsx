import { css } from "../../styled-system/css";
import { Layout } from "../components/Layout";
import { PostMeta } from "../components/PostMeta";
import { TableOfContents } from "../components/TableOfContents";
import { getAuthor } from "../lib/authors";
import { getPost } from "../lib/content";
import { renderMarkdown } from "../lib/markdown";

const hr = css({ border: "0", borderTop: "1px solid token(colors.border)", my: "10" });
const crumbLink = css({ color: "fg.muted", textDecoration: "none", _hover: { textDecoration: "underline" } });

// 本文（cirro の renderMarkdown が返すサニタイズ済み HTML）のコンテナ。
// 見た目は css() の子孫セレクタで整え、Prism のトークン配色もここに含める。
// スタイルはビルド時に外部 CSS へ抽出される（インライン style/style 属性を作らず style-src 'self' を満たす）。
const article = css({
    color: "fg",
    fontSize: "1.05rem",
    lineHeight: 1.9,
    wordBreak: "break-word",
    "& h2": { mt: "10", mb: "4", fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.4, scrollMarginTop: "4" },
    "& h3": { mt: "8", mb: "3", fontSize: "1.3rem", fontWeight: 700, scrollMarginTop: "4" },
    "& p": { my: "4" },
    "& a": { color: "primary", textDecoration: "underline" },
    "& ul, & ol": { pl: "6", my: "4" },
    "& li": { my: "1" },
    "& blockquote": {
        borderLeft: "4px solid token(colors.primary.light)",
        bg: "hover",
        m: "0",
        my: "6",
        px: "5",
        py: "2",
        color: "fg.muted",
    },
    "& code": {
        bg: "hover",
        px: "1.5",
        py: "0.5",
        borderRadius: "sm",
        fontSize: "0.9em",
        fontFamily: "mono",
    },
    "& pre": {
        bg: "#0f172a",
        color: "#e2e8f0",
        p: "5",
        borderRadius: "card",
        overflowX: "auto",
        my: "6",
    },
    "& pre code": { bg: "transparent", p: "0", color: "inherit", fontSize: "0.9rem" },
    // Prism（rehype-prism）が付与するトークンクラスの配色。インライン style は使わない。
    "& .token.comment, & .token.prolog, & .token.doctype, & .token.cdata": { color: "#64748b", fontStyle: "italic" },
    "& .token.punctuation": { color: "#94a3b8" },
    "& .token.keyword, & .token.attr-name, & .token.rule": { color: "#c084fc" },
    "& .token.string, & .token.attr-value, & .token.char, & .token.inserted": { color: "#86efac" },
    "& .token.number, & .token.boolean, & .token.constant, & .token.tag, & .token.deleted": { color: "#fca5a5" },
    "& .token.function, & .token.property, & .token.builtin": { color: "#7dd3fc" },
    "& .token.class-name, & .token.selector": { color: "#fcd34d" },
    "& .token.operator": { color: "#e2e8f0" },
    "& table": { borderCollapse: "collapse", width: "100%", my: "6" },
    "& th, & td": { border: "1px solid token(colors.border)", px: "3", py: "2", textAlign: "left" },
    "& th": { bg: "hover", fontWeight: 700 },
    "& img": { maxW: "100%", h: "auto", borderRadius: "card" },
    "& hr": { border: "0", borderTop: "1px solid token(colors.border)", my: "8" },
});

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
    // 本文を 1 パスでサニタイズ済み HTML（body）と目次（toc）に変換する。
    const { body, toc } = renderMarkdown(post.content, { className: article });

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

                <TableOfContents toc={toc} />

                {body}
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
