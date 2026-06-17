import { Layout } from "../components/Layout";
import { color, cssMain, fontSize, radii, space } from "../styles/system";

const FEATURES = [
    {
        title: "インラインスクリプトゼロ / 厳格 CSP",
        body: "生成される全ページがインラインスクリプトを含まず、script-src 'self' だけの CSP で動作します。",
    },
    {
        title: "島（islands）アーキテクチャ",
        body: "本文は静的 HTML として配信し、インタラクティブな部分だけを「島」としてクライアントでハイドレートします。",
    },
    {
        title: "React だけで書ける",
        body: "独自テンプレート構文を学ぶ必要はありません。普段の React の知識でサイトを構築できます。",
    },
    {
        title: "軽量な配信",
        body: "本文（静的部分）にはコードもランタイムも乗りません。動かしたい「島」の分だけ JavaScript を配信します。",
    },
];

// About ページ。島を含まない純粋な静的ページ（island={false} で JS ゼロ）。
export function AboutPage() {
    const para = cssMain({ margin_bottom: space(4), line_height: "1.9" });

    return (
        <Layout
            title="About — Cirro Blog"
            description="このサイトはセキュリティ第一の軽量 SSG「Cirro」で構築されています。"
            island={false}
        >
            <h1 className={cssMain({ font_size: "2rem", font_weight: "700", margin_bottom: space(6) })}>このサイトについて</h1>
            <p className={para}>
                Cirro Blog は、セキュリティを第一に考えた軽量な静的サイトジェネレーター「Cirro」の
                公式サンプルブログです。スタイルは Cirro 自前のスタイリングシステム（css()）で記述し、
                ルート単位に生成した外部 CSS だけで配信することで <code>style-src 'self'</code> の厳格な
                CSP を満たします。記事は Markdown（frontmatter にタイトル・著者・日付・タグを記載）で
                執筆しています。
            </p>
            <p className={para}>
                Markdown は remark / rehype でビルド時に HTML へ変換され、静的なページとして
                配信されます。クライアントへ送られる JavaScript は「島」の分だけで、すべて外部
                ファイルとして読み込まれます。
            </p>

            <hr className={cssMain({ border: "0", border_top: `1px solid ${color.border}`, margin_top: space(8), margin_bottom: space(8) })} />

            <h2 className={cssMain({ font_size: fontSize.xl, font_weight: "700", margin_bottom: space(4) })}>Cirro の特徴</h2>
            <ul className={cssMain({ display: "flex", flex_direction: "column", gap: space(4), list_style: "none", padding: "0" })}>
                {FEATURES.map((f) => (
                    <li key={f.title}>
                        <p className={cssMain({ font_weight: "700", margin_bottom: space(1) })}>{f.title}</p>
                        <p className={cssMain({ color: color.fgMuted })}>{f.body}</p>
                    </li>
                ))}
            </ul>

            <div className={cssMain({ margin_top: space(8), padding: space(6), background_color: color.hover, border_radius: radii.card })}>
                <p className={cssMain({ font_size: fontSize.sm, color: color.fgMuted })}>
                    このページは「島」を 1 つも含まない純粋な静的ページです。本文の表示に
                    JavaScript は必要なく、ハイドレーションも発生しません。Cirro が目指すのは、
                    こうしたページを JS ゼロで配信することです（島の有無に応じた配信の最適化は今後の課題です）。
                </p>
            </div>
        </Layout>
    );
}
