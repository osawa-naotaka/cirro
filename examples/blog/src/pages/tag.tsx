import { css } from "../../styled-system/css";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { postsByTag } from "../lib/content";

// タグ別の記事一覧（/tags/[tag]）。
export function TagPage({ params }: { params: { tag: string } }) {
    const { tag } = params;
    const tagged = postsByTag(tag);

    return (
        <Layout title={`#${tag} の記事 — Cirro Blog`} description={`タグ「${tag}」が付いた記事一覧。`}>
            <nav className={css({ display: "flex", alignItems: "center", gap: "2", fontSize: "sm", mb: "4" })}>
                <a href="/tags" className={css({ color: "fg.muted", textDecoration: "none", _hover: { textDecoration: "underline" } })}>
                    タグ一覧
                </a>
                <span className={css({ color: "fg.muted" })}>/</span>
                <span className={css({ color: "fg" })}>#{tag}</span>
            </nav>
            <h1 className={css({ fontSize: "2rem", fontWeight: 700, mb: "1" })}>#{tag}</h1>
            <p className={css({ color: "fg.muted", mb: "8" })}>{tagged.length} 件の記事</p>
            <PostList posts={tagged} empty="このタグの記事はまだありません。" />
        </Layout>
    );
}
