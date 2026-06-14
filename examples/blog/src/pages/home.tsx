import { css } from "../../styled-system/css";
import { button, chip } from "../../styled-system/recipes";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { allTags, posts } from "../lib/content";

// ホームページ: ヒーロー + 最新記事 + 人気タグ。
export function HomePage() {
    const recent = posts.slice(0, 3);
    const tags = allTags().slice(0, 8);

    return (
        <Layout
            title="Cirro Blog — セキュリティ第一の軽量 SSG"
            description="React の島アーキテクチャと厳格な CSP を実現する軽量 SSG「Cirro」の公式サンプルブログ。"
        >
            <section
                className={css({
                    p: { base: "6", md: "10" },
                    mb: "10",
                    borderRadius: "panel",
                    background: "linear-gradient(135deg, #1565c0 0%, #00897b 100%)",
                    color: "white",
                })}
            >
                <h1 className={css({ fontSize: { base: "2.25rem", md: "3rem" }, fontWeight: 700, mb: "3" })}>Cirro Blog</h1>
                <p className={css({ fontSize: "lg", opacity: 0.95, mb: "6" })}>
                    インラインスクリプトを一切生成せず、<code>script-src 'self'</code> の厳格な CSP を満たす。
                    React だけで書ける、軽量な静的サイトジェネレーター。
                </p>
                <div className={css({ display: "flex", flexWrap: "wrap", gap: "4" })}>
                    <a href="/blog" className={button({ variant: "contrast" })}>
                        記事を読む
                    </a>
                    <a href="/about" className={button({ variant: "outline" })}>
                        Cirro について
                    </a>
                </div>
            </section>

            <div className={css({ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: "4" })}>
                <h2 className={css({ fontSize: "xl", fontWeight: 700 })}>最新の記事</h2>
                <a href="/blog" className={button({ variant: "text", size: "sm" })}>
                    すべて見る
                </a>
            </div>
            <PostList posts={recent} />

            <hr className={css({ border: "0", borderTop: "1px solid token(colors.border)", my: "10" })} />

            <h2 className={css({ fontSize: "xl", fontWeight: 700, mb: "4" })}>タグから探す</h2>
            <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
                {tags.map(({ tag, count }) => (
                    <a key={tag} href={`/tags/${tag}`} className={chip()}>
                        {tag} ({count})
                    </a>
                ))}
            </div>
        </Layout>
    );
}
