import { css, genCssFn } from "cirrojs";
import { Island } from "../islands/Island";

// ホームページ（本文は静的 HTML、Counter だけが島）。
export function HomePage() {
    // reset css
    css({ margin: "0", padding: "0" }, { selector: "*", atrules: ["@layer base"] });

    const cssPC = genCssFn({ atRules: ["@media (min-width: 800px)"] });

    const pageTitle = cssPC({ padding: "1rem", font_size: "2rem" });

    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>cirro prototype</title>
            </head>
            <body>
                <h1 className={pageTitle}>cirro プロトタイプ</h1>
                <p>この本文は静的 HTML です。下のカウンターだけがクライアントで動く「島」です。</p>
                <nav>
                    <a href="/about">about</a> | <a href="/posts/hello">post: hello</a> | <a href="/posts/world">post: world</a>
                </nav>
                <Island name="counter" props={{ initial: 3 }} />
            </body>
        </html>
    );
}
