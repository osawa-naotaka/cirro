import { Link } from "cirrojs";
import { defineCascadeLayer, resetCss } from "cirrojs/layout";

// About ページ（静的・島なし → このページはクライアント JS の島が存在しない）。
export function AboutPage() {
    defineCascadeLayer();
    resetCss();
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>About - cirro</title>
            </head>
            <body>
                <h1>About</h1>
                <p>cirro プロトタイプの About ページです。島を含まない純粋な静的ページです。</p>
                <p>
                    <Link to="/">← home</Link>
                </p>
            </body>
        </html>
    );
}
