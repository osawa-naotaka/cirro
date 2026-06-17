import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { allTags, posts } from "../lib/content";
import { button, chip } from "../styles/recipes";
import { color, cssMain, cssMd, cx, fontSize, radii, space } from "../styles/system";

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
                className={cx(
                    cssMain({
                        padding: space(6),
                        margin_bottom: space(10),
                        border_radius: radii.panel,
                        background: `linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%)`,
                        color: color.white,
                    }),
                    cssMd({ padding: space(10) }),
                )}
            >
                <h1 className={cx(cssMain({ font_size: "2.25rem", font_weight: "700", margin_bottom: space(3) }), cssMd({ font_size: "3rem" }))}>Cirro Blog</h1>
                <p className={cssMain({ font_size: fontSize.lg, opacity: "0.95", margin_bottom: space(6) })}>
                    インラインスクリプトを一切生成せず、<code>script-src 'self'</code> の厳格な CSP を満たす。
                    React だけで書ける、軽量な静的サイトジェネレーター。
                </p>
                <div className={cssMain({ display: "flex", flex_wrap: "wrap", gap: space(4) })}>
                    <a href="/blog" className={button({ variant: "contrast" })}>
                        記事を読む
                    </a>
                    <a href="/about" className={button({ variant: "outline" })}>
                        Cirro について
                    </a>
                </div>
            </section>

            <div className={cssMain({ display: "flex", justify_content: "space-between", align_items: "baseline", margin_bottom: space(4) })}>
                <h2 className={cssMain({ font_size: fontSize.xl, font_weight: "700" })}>最新の記事</h2>
                <a href="/blog" className={button({ variant: "text", size: "sm" })}>
                    すべて見る
                </a>
            </div>
            <PostList posts={recent} />

            <hr className={cssMain({ border: "0", border_top: `1px solid ${color.border}`, margin_top: space(10), margin_bottom: space(10) })} />

            <h2 className={cssMain({ font_size: fontSize.xl, font_weight: "700", margin_bottom: space(4) })}>タグから探す</h2>
            <div className={cssMain({ display: "flex", flex_wrap: "wrap", gap: space(2) })}>
                {tags.map(({ tag, count }) => (
                    <a key={tag} href={`/tags/${tag}`} className={chip()}>
                        {tag} ({count})
                    </a>
                ))}
            </div>
        </Layout>
    );
}
