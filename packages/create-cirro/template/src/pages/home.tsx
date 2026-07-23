import { Link } from "cirrojs";
import { Layout } from "../components/Layout";
import { Island } from "../islands/Island";
import {
    badge,
    button,
    card,
    cluster,
    code,
    color,
    cssMain,
    cssPc,
    cx,
    fontSize,
    grid,
    muted,
    pageTitle,
    radii,
    sectionTitle,
    shadow,
    space,
    stack,
    textLink,
} from "../styles";

const POSTS = [
    { slug: "hello", summary: "動的ルート /posts/[slug] の 1 件目。" },
    { slug: "world", summary: "getStaticPaths が返したもう 1 件。" },
];

// ホームページ（本文は静的 HTML、Counter だけが島）。
export function HomePage() {
    const hero = cx(
        stack({ gap: space(5) }),
        cssMain({
            background_image: color.accentGradient,
            border_radius: radii.lg,
            box_shadow: shadow.hero,
            color: color.white,
            padding: space(8),
        }),
        cssPc({ padding: space(12) }),
    );

    return (
        <Layout title="cirro prototype" description="インラインスクリプトを一切生成しない、React の島アーキテクチャによる軽量 SSG">
            <section className={hero}>
                <span className={badge({ tone: "onDark" })}>SECURITY FIRST SSG</span>
                <h1 className={pageTitle()}>cirro プロトタイプ</h1>
                <p className={cssMain({ font_size: fontSize.lg, max_width: "36rem" })}>
                    このページの本文はビルド時に静的 HTML になっています。クライアントへ送られる JS は、下のカウンターのような「島」の分だけです。
                </p>
                <div className={cluster({ gap: space(3) })}>
                    <Link to="/about" className={button({ variant: "contrast" })}>
                        この雛形について
                    </Link>
                    <Link to="/posts/hello" className={button({ variant: "outline" })}>
                        動的ルートを見る
                    </Link>
                </div>
            </section>

            <section className={stack({ gap: space(4) })}>
                <h2 className={sectionTitle()}>島（island）</h2>
                <p className={muted()}>下のカウンターだけがクライアントで動きます。props は data-* 属性で渡され、インラインスクリプトは生成されません。</p>
                <div className={card()}>
                    <Island name="counter" props={{ initial: 3 }} />
                </div>
            </section>

            <section className={stack({ gap: space(4) })}>
                <h2 className={sectionTitle()}>動的ルート</h2>
                <ul className={cx(grid({ min: "14rem", gap: space(4) }), cssMain({ list_style: "none" }))}>
                    {POSTS.map((post) => (
                        <li key={post.slug}>
                            <Link
                                to={`/posts/${post.slug}`}
                                className={cx(
                                    card({ padding: space(5) }),
                                    stack({ gap: space(2) }),
                                    cssMain({ transition: "border-color .15s, box-shadow .15s" }),
                                    cssMain({ border_color: color.accent }, { selector: "$:hover" }),
                                )}
                            >
                                <span className={cssMain({ font_size: fontSize.lg, font_weight: "700" })}>posts/{post.slug}</span>
                                <span className={muted()}>{post.summary}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <p className={muted()}>
                ルート定義は <code className={code()}>src/routes.ts</code>、スタイルは <code className={code()}>src/styles.ts</code> にあります。詳しくは{" "}
                <Link to="/about" className={textLink()}>
                    About
                </Link>
                を参照してください。
            </p>
        </Layout>
    );
}
