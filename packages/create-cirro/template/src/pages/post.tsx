import type { PageProps } from "cirrojs";
import { Link } from "cirrojs";
import { Layout } from "../components/Layout";
import { Island } from "../islands/Island";
import { badge, button, card, code, cx, lead, muted, pageTitle, sectionTitle, space, stack } from "../styles";

// 動的ルート /posts/[slug] のページ。params.slug を受け取る。
export function PostPage({ params }: PageProps<undefined, { slug: string }>) {
    return (
        <Layout title={`post: ${params.slug}`} description={`動的ルート /posts/[slug] のページ（slug = ${params.slug}）。`}>
            <article className={stack({ gap: space(5) })}>
                <div className={stack({ gap: space(3) })}>
                    <span className={badge()}>DYNAMIC ROUTE</span>
                    <h1 className={pageTitle()}>Post: {params.slug}</h1>
                    <p className={muted()}>/posts/[slug] — getStaticPaths が返した slug ごとに 1 枚の HTML が生成されます。</p>
                </div>

                <p className={lead()}>
                    このページは動的ルートの実例です。ルート定義の <code className={code()}>path</code> が受け取る params
                    には型が付くので、存在しないパラメータを書くと型エラーになります。
                </p>

                <section className={cx(card(), stack({ gap: space(4) }))}>
                    <h2 className={sectionTitle()}>このページの島</h2>
                    <p className={muted()}>ページが違っても島のコードは全ページ共有の単一バンドルから読み込まれます。</p>
                    <Island name="counter" props={{ initial: 1 }} />
                </section>
            </article>

            <p>
                <Link to="/" className={button({ variant: "solid" })}>
                    ← home
                </Link>
            </p>
        </Layout>
    );
}
