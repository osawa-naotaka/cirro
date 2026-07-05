import type { PageProps } from "cirrojs";
import { Layout } from "../components/Layout";
import { PostList } from "../components/PostList";
import { color, cssMain, space } from "../styles/system";
import type { content } from "../content";

// ブログインデックス: 全記事を新しい順に一覧表示。
export function BlogIndexPage(props: PageProps<typeof content>) {
    return (
        <Layout title="記事一覧 — Cirro Blog" description="Cirro Blog の全記事一覧。">
            <h1 className={cssMain({ font_size: "2rem", font_weight: "700", margin_bottom: space(1) })}>記事一覧</h1>
            <p className={cssMain({ color: color.fgMuted, margin_bottom: space(8) })}>全 {props.content.posts.length} 件</p>
            <PostList posts={props.content.posts} />
        </Layout>
    );
}
