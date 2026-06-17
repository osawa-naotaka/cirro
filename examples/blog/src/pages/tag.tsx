import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { postsByTag } from "../lib/content";
import { color, cssMain, cx, fontSize, space } from "../styles/system";

// タグ別の記事一覧（/tags/[tag]）。
export function TagPage({ params }: { params: { tag: string } }) {
    const { tag } = params;
    const tagged = postsByTag(tag);

    return (
        <Layout title={`#${tag} の記事 — Cirro Blog`} description={`タグ「${tag}」が付いた記事一覧。`}>
            <nav className={cssMain({ display: "flex", align_items: "center", gap: space(2), font_size: fontSize.sm, margin_bottom: space(4) })}>
                <a
                    href="/tags"
                    className={cx(
                        cssMain({ color: color.fgMuted, text_decoration: "none" }),
                        cssMain({ text_decoration: "underline" }, { selector: "&:hover" }),
                    )}
                >
                    タグ一覧
                </a>
                <span className={cssMain({ color: color.fgMuted })}>/</span>
                <span className={cssMain({ color: color.fg })}>#{tag}</span>
            </nav>
            <h1 className={cssMain({ font_size: "2rem", font_weight: "700", margin_bottom: space(1) })}>#{tag}</h1>
            <p className={cssMain({ color: color.fgMuted, margin_bottom: space(8) })}>{tagged.length} 件の記事</p>
            <PostList posts={tagged} empty="このタグの記事はまだありません。" />
        </Layout>
    );
}
