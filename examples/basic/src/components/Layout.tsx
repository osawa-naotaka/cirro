import { Link } from "cirrojs";
import type { ReactNode } from "react";
import { applyGlobalStyles, button, color, container, cssMain, cx, fontSize, muted, space, stack } from "../styles";

type LayoutProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

const NAV = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/posts/hello", label: "Post" },
];

// 生成物はインラインスクリプトもインラインスタイルも含まないため、これだけで成立する
// （default-src が script-src / style-src / font-src のフォールバックになる）。
const CSP = "default-src 'self'";

// 全ページ共通のシェル。<html> 全体を返し、ヘッダー / フッターと共通スタイルを提供する。
// CSS の <link> はランタイムが自動挿入するため、ここには書かない。
export function Layout({ title, description, children }: LayoutProps) {
    // リセット・グローバルスタイルをこのルートの CSS に登録する。
    applyGlobalStyles();

    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                {/* build 時のみ CSP meta を出力する。dev は Vite の HMR クライアントがインラインスクリプトを
                    注入するため、厳格な CSP を当てると開発が成立しない（04_USAGE.md 9.1）。 */}
                {process.env.CIRRO_COMMAND === "build" ? <meta httpEquiv="Content-Security-Policy" content={CSP} /> : null}
                <title>{title}</title>
                {description ? <meta name="description" content={description} /> : null}
            </head>
            <body>
                <header
                    className={cssMain({
                        background_color: color.surface,
                        border_bottom: `1px solid ${color.border}`,
                        position: "sticky",
                        top: "0",
                        z_index: "10",
                    })}
                >
                    <div className={cx(container(), cssMain({ display: "flex", align_items: "center", gap: space(2), height: space(16) }))}>
                        <Link
                            to="/"
                            className={cssMain({
                                flex_grow: "1",
                                font_size: fontSize.lg,
                                font_weight: "700",
                                letter_spacing: "-0.02em",
                                color: color.accentDark,
                            })}
                        >
                            cirro
                        </Link>
                        <nav className={cssMain({ display: "flex", align_items: "center", gap: space(1) })}>
                            {NAV.map((item) => (
                                <Link key={item.to} to={item.to} className={button()}>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </header>

                <main className={cx(container(), stack({ gap: space(8) }), cssMain({ flex_grow: "1", padding_block: `${space(10)} ${space(14)}` }))}>
                    {children}
                </main>

                <footer className={cssMain({ border_top: `1px solid ${color.border}`, padding_block: space(6) })}>
                    <div className={cx(container(), cssMain({ text_align: "center" }))}>
                        <p className={muted()}>Built with Cirro — インラインスクリプトゼロの軽量 SSG</p>
                    </div>
                </footer>
            </body>
        </html>
    );
}
