import { Link, type PageProps } from "cirrojs";
import { Layout } from "../components/Layout";
import type { content } from "../content";
import { allTags } from "../lib/content";
import { Cluster } from "../styles/layout";
import { chip } from "../styles/recipes";
import { color, cssMain, space } from "../styles/system";

// タグインデックス: 全タグを記事数つきで一覧表示。島なし＝JS ゼロのページ。
export function TagIndexPage(props: PageProps<typeof content>) {
    const tags = allTags(props.content.posts);

    return (
        <Layout title="タグ一覧 — Cirro Blog" description="Cirro Blog の全タグ一覧。" island={false}>
            <h1 className={cssMain({ font_size: "2rem", font_weight: "700", margin_bottom: space(1) })}>タグ一覧</h1>
            <p className={cssMain({ color: color.fgMuted, margin_bottom: space(8) })}>全 {tags.length} 個のタグ</p>
            <Cluster gap={space(3)}>
                {tags.map(({ tag, count }) => (
                    <Link key={tag} to={`/tags/${tag}`} className={chip({ size: "md" })}>
                        {tag} ({count})
                    </Link>
                ))}
            </Cluster>
        </Layout>
    );
}
