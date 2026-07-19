import { type PageProps, rssXml } from "cirrojs";
import type { content } from "../content";

// RSS フィード（ファイルルート）。channel の title / description / language は site の宣言から
// 補われる。item の path は Link と同じレールでビルド時に存在検証される。
export function rssFeed(props: PageProps<typeof content>): string {
    return rssXml({
        items: props.content.posts.map((post) => ({
            title: post.title,
            path: `/blog/${post.slug}`,
            date: new Date(post.date),
            description: post.description,
        })),
    });
}
