import { defineCascadeLayer, resetCss } from "cirrojs/layout";
import { Island } from "../islands/Island";
import type { PageProps } from "cirrojs";
import { Link } from "cirrojs";

// 動的ルート /posts/[slug] のページ。params.slug を受け取る。
export function PostPage({ params }: PageProps<undefined, { slug: string }>) {
    defineCascadeLayer();
    resetCss();
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{`post: ${params.slug}`}</title>
            </head>
            <body>
                <h1>{`Post: ${params.slug}`}</h1>
                <p>これは動的ルート /posts/[slug] のページです。</p>
                <p>
                    <Link to="/">← home</Link>
                </p>
                <Island name="counter" props={{ initial: 1 }} />
            </body>
        </html>
    );
}
