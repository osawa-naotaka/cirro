import { AppBar, Box, Button, Container, CssBaseline, ThemeProvider, Toolbar, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Island } from "../islands/Island";
import { theme } from "../theme/theme";

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

// 全ページ共通のシェル。<html> 全体を返し、Material UI のテーマ・リセット・ナビゲーション・
// フッターを提供する。本文はビルド時に静的 HTML 化される。
export function Layout({ title, description, children, island = true }: LayoutProps) {
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
                {description ? <meta name="description" content={description} /> : null}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap"
                />
            </head>
            <body>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                        <AppBar position="static" elevation={0} color="primary">
                            <Container maxWidth="md">
                                <Toolbar disableGutters sx={{ gap: 1 }}>
                                    <Typography
                                        variant="h6"
                                        component="a"
                                        href="/"
                                        sx={{ fontWeight: 700, color: "inherit", textDecoration: "none", flexGrow: 1 }}
                                    >
                                        Cirro Blog
                                    </Typography>
                                    {NAV.map((item) => (
                                        <Button key={item.href} href={item.href} color="inherit">
                                            {item.label}
                                        </Button>
                                    ))}
                                </Toolbar>
                            </Container>
                        </AppBar>

                        <Container component="main" maxWidth="md" sx={{ flexGrow: 1, py: { xs: 4, md: 6 } }}>
                            {children}
                        </Container>

                        <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", py: 3, mt: 4 }}>
                            <Container maxWidth="md">
                                <Typography variant="body2" color="text.secondary" align="center">
                                    © 2026 Cirro Blog — セキュリティ第一の軽量 SSG「Cirro」で構築
                                </Typography>
                            </Container>
                        </Box>
                    </Box>

                    {island ? <Island name="scrollTop" props={{}} /> : null}
                </ThemeProvider>
            </body>
        </html>
    );
}
