import type { ReactNode } from "react";
import { Island } from "../islands/Island";
import { center } from "../styles/layout";
import { button } from "../styles/recipes";
import { applyGlobalStyles, color, cssMain, cssMd, cx, fontSize, space } from "../styles/system";

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

// 全ページ共通のシェル。<html> 全体を返し、ナビゲーション・フッターを提供する。
// スタイルは Cirro 自前の css() がルート単位に生成する外部 CSS から読み込む。
// CSS の <link> はランタイムが cssPath を元に自動挿入するため、ここでは記述しない。
// インライン <style> も style="" 属性も一切生成しない（style-src 'self' を満たす）。
export function Layout({ title, description, children, island = true }: LayoutProps) {
    // リセット・グローバルスタイルをこのルートの CSS に登録する。
    applyGlobalStyles();

    // 横幅を制限して中央寄せする共通コンテナ。最大幅は layout の既定（centerMax = 56rem）を使う。
    const container = center({ gutters: space(4) });

    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
                {description ? <meta name="description" content={description} /> : null}
            </head>
            <body>
                <div className={cssMain({ display: "flex", flex_direction: "column", min_height: "100vh" })}>
                    <header className={cssMain({ background_color: color.primary, color: color.white })}>
                        <div className={cx(container, cssMain({ display: "flex", align_items: "center", gap: space(1), height: space(16) }))}>
                            <a href="/" className={cssMain({ flex_grow: "1", font_size: fontSize.lg, font_weight: "700", color: "inherit", text_decoration: "none" })}>
                                Cirro Blog
                            </a>
                            {NAV.map((item) => (
                                <a key={item.href} href={item.href} className={button({ variant: "text" })}>
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </header>

                    <main className={cx(container, cssMain({ flex_grow: "1", padding_top: space(8), padding_bottom: space(8) }), cssMd({ padding_top: space(12), padding_bottom: space(12) }))}>
                        {children}
                    </main>

                    <footer className={cssMain({ border_top: `1px solid ${color.border}`, padding_top: space(6), padding_bottom: space(6), margin_top: space(8) })}>
                        <div className={container}>
                            <p className={cssMain({ text_align: "center", font_size: fontSize.sm, color: color.fgMuted })}>
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
