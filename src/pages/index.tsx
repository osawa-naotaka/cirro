import { Island } from "../Island";

// ページ全体（本文は静的 HTML、Counter だけが島）。
// 島は <Island> が renderToString でマーカー付き描画し、本文は renderToStaticMarkup で純静的に保つ。
export function Page() {
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
                <Island name="counter" props={{ initial: 3 }} />
            </body>
        </html>
    );
}
