import { Image, Link, pageUrl } from "cirrojs";
import { createMarkdownProcessor } from "cirrojs/server";
import { Island } from "../islands/Island";

const { Markdown } = createMarkdownProcessor();

// 各違反が 1 件ずつ現れるページ。ビルドはすべてを収集して報告し、非ゼロで終了する。
export function HomePage() {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <title>broken refs</title>
            </head>
            <body>
                {/* broken-link: not-found / malformed */}
                <Link to="/nope">missing page</Link>
                <Link to="//evil.example.com">protocol relative</Link>

                {/* broken-image-src: not-found / malformed */}
                <Image from="/images/nope.png" alt="missing" />
                <Image from="./relative.png" alt="relative" />

                {/* island: not-configured（islands 未設定）/ island-props: function */}
                <Island name="counter" props={{ label: "x", onPick: () => undefined } as never} />

                {/* missing-site: site 未宣言のまま pageUrl() を使う */}
                <p>{pageUrl()}</p>

                {/* markdown-ref: 本文中の href / src */}
                <Markdown source={"[missing](/nope-md)\n\n![missing](./rel.png)"} />
            </body>
        </html>
    );
}
