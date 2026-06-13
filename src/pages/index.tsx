import { Counter } from "../islands/Counter";

// ページ全体（本文は静的、Counter だけが島）。
// 島のプレースホルダには初期描画 HTML も入れておき、クライアントで hydrateRoot する。
export function Page() {
    const counterProps = { initial: 3 };
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
                <div data-island="counter" data-props={JSON.stringify(counterProps)}>
                    <Counter {...counterProps} />
                </div>
            </body>
        </html>
    );
}
