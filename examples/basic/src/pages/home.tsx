import { Island } from "../islands/Island";

// ホームページ（本文は静的 HTML、Counter だけが島）。
export function HomePage() {
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>cirro prototype</title>
            </head>
            <body>
                <h1>cirro プロトタイプ</h1>
                <p>この本文は静的 HTML です。下のカウンターだけがクライアントで動く「島」です。</p>
                <nav>
                    <a href="/about">about</a> | <a href="/posts/hello">post: hello</a> | <a href="/posts/world">post: world</a>
                </nav>
                <Island name="counter" props={{ initial: 3 }} />
            </body>
        </html>
    );
}
