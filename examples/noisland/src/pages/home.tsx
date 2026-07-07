import { at, genCssFn, Link } from "cirrojs";
import { defineCascadeLayer, resetCss } from "cirrojs/layout";

// ホームページ（本文は静的 HTML、Counter だけが島）。
export function HomePage() {
    // reset css
    defineCascadeLayer();
    resetCss();

    const cssPC = genCssFn((fn) => at("@media (min-width: 800px)", fn()));

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
                <p>この本文は静的 HTML です。</p>
                <nav>
                    <Link to="/about">about</Link> | <Link to="/posts/hello">post: hello</Link> | <Link to="/posts/world">post: world</Link>
                </nav>
            </body>
        </html>
    );
}
