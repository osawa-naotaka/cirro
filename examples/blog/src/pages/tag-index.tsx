import { css } from "../../styled-system/css";
import { chip } from "../../styled-system/recipes";
import { Layout } from "../components/Layout";
import { allTags } from "../lib/content";

// タグインデックス: 全タグを記事数つきで一覧表示。島なし＝JS ゼロのページ。
export function TagIndexPage() {
    const tags = allTags();

    return (
        <Layout title="タグ一覧 — Cirro Blog" description="Cirro Blog の全タグ一覧。" island={false}>
            <h1 className={css({ fontSize: "2rem", fontWeight: 700, mb: "1" })}>タグ一覧</h1>
            <p className={css({ color: "fg.muted", mb: "8" })}>全 {tags.length} 個のタグ</p>
            <div className={css({ display: "flex", flexWrap: "wrap", gap: "3" })}>
                {tags.map(({ tag, count }) => (
                    <a key={tag} href={`/tags/${tag}`} className={chip({ size: "md" })}>
                        {tag} ({count})
                    </a>
                ))}
            </div>
        </Layout>
    );
}
