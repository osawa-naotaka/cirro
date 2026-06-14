import { createTheme } from "@mui/material/styles";

// サイト全体の Material UI テーマ。
// ビルド時にサーバーで描画され、emotion がスタイルを HTML に展開する。
export const theme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#1565c0" },
        secondary: { main: "#00897b" },
        background: { default: "#f7f9fc" },
    },
    typography: {
        fontFamily: ['"Noto Sans JP"', "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
    },
    shape: { borderRadius: 10 },
});
