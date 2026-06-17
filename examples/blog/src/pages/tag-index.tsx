import { Layout } from "../components/Layout";
import { allTags } from "../lib/content";
import { chip } from "../styles/recipes";
import { color, cssMain, space } from "../styles/system";

// タグインデックス: 全タグを記事数つきで一覧表示。島なし＝JS ゼロのページ。
export function TagIndexPage() {
    const tags = allTags();

    return (
        <Layout title="タグ一覧 — Cirro Blog" description="Cirro Blog の全タグ一覧。" island={false}>
            <h1 className={cssMain({ font_size: "2rem", font_weight: "700", margin_bottom: space(1) })}>タグ一覧</h1>
            <p className={cssMain({ color: color.fgMuted, margin_bottom: space(8) })}>全 {tags.length} 個のタグ</p>
            <div className={cssMain({ display: "flex", flex_wrap: "wrap", gap: space(3) })}>
                {tags.map(({ tag, count }) => (
                    <a key={tag} href={`/tags/${tag}`} className={chip({ size: "md" })}>
                        {tag} ({count})
                    </a>
                ))}
            </div>
        </Layout>
    );
}
