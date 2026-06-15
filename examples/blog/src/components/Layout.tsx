import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { button } from "../../styled-system/recipes";
import { Island } from "../islands/Island";

type LayoutProps = {
    title: string;
    description?: string;
    children: ReactNode;
    // 「上部へ戻る」島を出すか。false にすると島ゼロ＝そのページは JS ゼロで配信される。
    island?: boolean;
};

const NAV = [
    { href: "/blog", label: "Blog" },
    { href: "/tags", label: "Tags" },
    { href: "/about", label: "About" },
];

// 横幅を md（約 56rem）に制限して中央寄せする共通コンテナ。MUI の <Container maxWidth="md"> 相当。
const container = css({ width: "100%", maxW: "56rem", mx: "auto", px: "4" });

// 全ページ共通のシェル。<html> 全体を返し、ナビゲーション・フッターを提供する。
// スタイルは Panda がビルド時に生成した外部 CSS（/styles.css）から読み込むため、
// インライン <style> も style="" 属性も一切生成しない（style-src 'self' を満たす）。
export function Layout({ title, description, children, island = true }: LayoutProps) {
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
                {description ? <meta name="description" content={description} /> : null}
                <link rel="stylesheet" href="/styles.css" />
            </head>
            <body>
                <div className={css({ display: "flex", flexDir: "column", minH: "100vh" })}>
                    <header className={css({ bg: "primary", color: "white" })}>
                        <div className={`${container} ${css({ display: "flex", alignItems: "center", gap: "1", h: "16" })}`}>
                            <a href="/" className={css({ flexGrow: 1, fontSize: "lg", fontWeight: 700, color: "inherit", textDecoration: "none" })}>
                                Cirro Blog
                            </a>
                            {NAV.map((item) => (
                                <a key={item.href} href={item.href} className={button({ variant: "text" })}>
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </header>

                    <main className={`${container} ${css({ flexGrow: 1, py: { base: "8", md: "12" } })}`}>{children}</main>

                    <footer className={css({ borderTop: "1px solid token(colors.border)", py: "6", mt: "8" })}>
                        <div className={container}>
                            <p className={css({ textAlign: "center", fontSize: "sm", color: "fg.muted" })}>
                                © 2026 Cirro Blog — セキュリティ第一の軽量 SSG「Cirro」で構築
                            </p>
                        </div>
                    </footer>
                </div>

                {island ? <Island name="scrollTop" props={{}} /> : null}
            </body>
        </html>
    );
}
