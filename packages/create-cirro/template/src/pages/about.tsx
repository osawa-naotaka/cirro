import { Link } from "cirrojs";
import { Layout } from "../components/Layout";
import { badge, button, card, color, cssMain, cx, fontSize, lead, muted, pageTitle, sectionTitle, space, stack } from "../styles";

const FEATURES = [
    { title: "インラインスクリプトゼロ", body: "生成 HTML に <script> のインラインが 1 つも残らないため、script-src 'self' だけの CSP で動きます。" },
    {
        title: "インラインスタイルゼロ",
        body: "スタイルは外部 CSS ファイルとして配信されます。インラインの style 要素も style 属性も出力しないので、style-src 'self' も満たします。",
    },
    { title: "型付きルーティング", body: "routes.ts にルートをオブジェクトとして書き、動的ルートのパラメータまで型で守られます。" },
];

// About ページ（静的・島なし → このページはクライアント JS の島が存在しない）。
export function AboutPage() {
    return (
        <Layout title="About - cirro" description="cirro プロトタイプの About ページ。島を含まない純粋な静的ページです。">
            <section className={stack({ gap: space(4) })}>
                <span className={badge()}>NO ISLANDS</span>
                <h1 className={pageTitle()}>About</h1>
                <p className={lead()}>cirro プロトタイプの About ページです。島を 1 つも含まない、純粋な静的ページになっています。</p>
            </section>

            <section className={stack({ gap: space(4) })}>
                <h2 className={sectionTitle()}>この雛形が示すもの</h2>
                <ul className={cx(stack({ gap: space(4) }), cssMain({ list_style: "none" }))}>
                    {FEATURES.map((feature) => (
                        <li key={feature.title} className={cx(card({ padding: space(5) }), stack({ gap: space(2) }))}>
                            <h3 className={cssMain({ font_size: fontSize.md, color: color.accentDark })}>{feature.title}</h3>
                            <p className={muted()}>{feature.body}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <p>
                <Link to="/" className={button({ variant: "solid" })}>
                    ← home
                </Link>
            </p>
        </Layout>
    );
}
