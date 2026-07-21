import { genCssFn, Link } from "cirrojs";

const css = genCssFn();

export function HomePage() {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <title>valid fixture</title>
            </head>
            <body>
                <h1 className={css({ font_size: "2rem" })}>valid</h1>
                <Link to="/about">about</Link>
            </body>
        </html>
    );
}
