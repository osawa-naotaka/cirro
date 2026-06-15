import { Island } from "../islands/Island";

// 動的ルート /posts/[slug] のページ。params.slug を受け取る。
export function PostPage({ params }: { params: { slug: string } }) {
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
                    <a href="/">← home</a>
                </p>
                <Island name="counter" props={{ initial: 1 }} />
            </body>
        </html>
    );
}
