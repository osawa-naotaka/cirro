import { defineConfig, defineRecipe } from "@pandacss/dev";

// クリック可能なボタン/リンクボタンの見た目。MUI の Button を置き換える。
// すべてビルド時に styled-system/styles.css へ抽出されるため、ランタイムのスタイル注入は起きない。
const button = defineRecipe({
    className: "btn",
    description: "ボタン/リンクボタン",
    base: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "2",
        px: "4",
        py: "2",
        fontSize: "sm",
        fontWeight: 600,
        lineHeight: 1.5,
        borderRadius: "pill",
        border: "1px solid transparent",
        cursor: "pointer",
        textDecoration: "none",
        transition: "background-color .2s, box-shadow .2s, opacity .2s",
    },
    variants: {
        variant: {
            // 塗りつぶし（プライマリ）。
            solid: { bg: "primary", color: "white", _hover: { bg: "primary.dark" } },
            // 枠線のみ。色は継承（ヒーロー上の白文字などに使う）。
            outline: { borderColor: "currentcolor", color: "inherit", _hover: { bg: "whiteAlpha.150" } },
            // テキストのみ（ナビゲーション等）。色は継承。
            text: { color: "inherit", _hover: { bg: "blackAlpha.100" } },
            // 濃い背景の上に置く反転ボタン（白地・プライマリ文字）。
            contrast: { bg: "white", color: "primary", _hover: { opacity: 0.85 } },
        },
        size: {
            sm: { px: "3", py: "1.5", fontSize: "xs" },
            md: {},
        },
    },
    defaultVariants: { variant: "text", size: "md" },
});

// タグ等に使う小さなピル。MUI の Chip を置き換える。
const chip = defineRecipe({
    className: "chip",
    description: "タグ用のピル",
    base: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "pill",
        border: "1px solid token(colors.primary)",
        color: "primary",
        bg: "transparent",
        fontSize: "xs",
        lineHeight: 1.6,
        px: "2.5",
        py: "0.5",
        textDecoration: "none",
        transition: "background-color .2s",
        _hover: { bg: "hover" },
    },
    variants: {
        size: {
            sm: {},
            md: { fontSize: "sm", px: "3", py: "1.5" },
        },
    },
    defaultVariants: { size: "sm" },
});

export default defineConfig({
    // preflight で MUI の CssBaseline 相当のリセットを入れる。
    preflight: true,
    // 島も含めて全ソースを走査し、使われたクラスのみ抽出する。
    include: ["./src/**/*.{ts,tsx}"],
    exclude: [],
    outdir: "styled-system",
    // 文字列を直接 className に渡す方式（JSX ラッパーは使わない）。
    jsxFramework: undefined,
    theme: {
        extend: {
            tokens: {
                colors: {
                    primary: {
                        DEFAULT: { value: "#1565c0" },
                        light: { value: "#5e92f3" },
                        dark: { value: "#003c8f" },
                    },
                    secondary: { value: "#00897b" },
                    // 背景・サーフェス。
                    bg: { value: "#f7f9fc" },
                    surface: { value: "#ffffff" },
                    // 文字色（MUI の text.primary / text.secondary 相当）。
                    fg: {
                        DEFAULT: { value: "#1a2530" },
                        muted: { value: "#5b6b7b" },
                    },
                    // 区切り線（MUI の divider 相当）。
                    border: { value: "#e2e8f0" },
                    // ホバー背景（MUI の action.hover 相当）。
                    hover: { value: "rgba(15, 23, 42, 0.04)" },
                    // 半透明の白/黒（枠線ボタンのホバー等）。
                    whiteAlpha: { 150: { value: "rgba(255, 255, 255, 0.15)" } },
                    blackAlpha: { 100: { value: "rgba(15, 23, 42, 0.06)" } },
                },
                radii: {
                    card: { value: "10px" },
                    panel: { value: "16px" },
                    pill: { value: "999px" },
                },
                fonts: {
                    // システムフォントスタック（日本語含む）。外部フォントを読まず style-src 'self' / font-src 'self' を満たす。
                    body: {
                        value: [
                            "-apple-system",
                            "BlinkMacSystemFont",
                            '"Segoe UI"',
                            "Roboto",
                            '"Helvetica Neue"',
                            "Arial",
                            '"Hiragino Sans"',
                            '"Hiragino Kaku Gothic ProN"',
                            '"Noto Sans JP"',
                            '"Yu Gothic"',
                            "Meiryo",
                            "sans-serif",
                        ].join(", "),
                    },
                    mono: { value: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
                },
            },
            recipes: { button, chip },
        },
    },
    // サイト全体の基本スタイル（body 背景・既定文字色・フォント・リンク）。
    globalCss: {
        "html, body": {
            bg: "bg",
            color: "fg",
            fontFamily: "body",
            lineHeight: 1.6,
        },
        a: { color: "inherit" },
    },
});
