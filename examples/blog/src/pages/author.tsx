import { css } from "../../styled-system/css";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { getAuthor } from "../lib/authors";
import { postsByAuthor } from "../lib/content";

// 著者ページ（/authors/[id]）: プロフィール + 執筆記事。
export function AuthorPage({ params }: { params: { id: string } }) {
    const author = getAuthor(params.id);
    const written = postsByAuthor(author.id);

    return (
        <Layout title={`${author.name} — Cirro Blog`} description={author.bio}>
            <div className={css({ border: "1px solid token(colors.border)", borderRadius: "panel", p: { base: "6", md: "8" }, mb: "10" })}>
                <div className={css({ display: "flex", flexDir: { base: "column", sm: "row" }, gap: "6", alignItems: { sm: "center" } })}>
                    <div
                        className={css({
                            flexShrink: 0,
                            w: "18",
                            h: "18",
                            borderRadius: "full",
                            bg: "primary",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.75rem",
                        })}
                    >
                        {author.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className={css({ fontSize: "2rem", fontWeight: 700 })}>{author.name}</h1>
                        <p className={css({ color: "primary", mb: "1" })}>{author.role}</p>
                        <p className={css({ color: "fg.muted" })}>{author.bio}</p>
                    </div>
                </div>
            </div>

            <h2 className={css({ fontSize: "xl", fontWeight: 700, mb: "4" })}>
                {author.name} の記事（{written.length} 件）
            </h2>
            <PostList posts={written} empty="まだ記事がありません。" />
        </Layout>
    );
}
