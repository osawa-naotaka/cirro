import { css, genCssFn, type CssOpt, type Properties } from "cirrojs";

// Cirro 自前スタイリングシステム（旧 panda.config.ts のテーマを TypeScript の定数へ移植）。
// 値はすべて型付きの定数・関数として表現し、文字列トークンや特殊記法は使わない。

// ============================================================
// デザイントークン
// ============================================================

// 色（MUI 由来のパレット）。
export const color = {
    primary: "#1565c0",
    primaryLight: "#5e92f3",
    primaryDark: "#003c8f",
    secondary: "#00897b",
    // 背景・サーフェス。
    bg: "#f7f9fc",
    surface: "#ffffff",
    // 文字色（MUI の text.primary / text.secondary 相当）。
    fg: "#1a2530",
    fgMuted: "#5b6b7b",
    // 区切り線（MUI の divider 相当）。
    border: "#e2e8f0",
    // ホバー背景（MUI の action.hover 相当）。
    hover: "rgba(15, 23, 42, 0.04)",
    white: "#ffffff",
    // 半透明の白/黒（枠線ボタンのホバー等）。
    whiteAlpha150: "rgba(255, 255, 255, 0.15)",
    blackAlpha100: "rgba(15, 23, 42, 0.06)",
} as const;

// 角丸。
export const radii = {
    sm: "0.25rem",
    card: "10px",
    panel: "16px",
    pill: "999px",
    full: "9999px",
} as const;

// フォントスタック。外部フォントを読まず style-src 'self' / font-src 'self' を満たす。
export const font = {
    body: [
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
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

// フォントサイズ（旧 panda fontSizes トークン）。
export const fontSize = {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
} as const;

// 影。
export const shadow = {
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
} as const;

// 間隔スケール。旧 panda spacing と同じく `n * 0.25rem` を返す（space(4) → "1rem"）。
export function space(n: number): string {
    return `${n * 0.25}rem`;
}

// ============================================================
// css ヘルパー
// ============================================================

// 通常のコンポーネントスタイル（@layer main）。
// 素の css() は「レイヤー無し」として出力され、@layer 付きのどのスタイルより優先されてしまう。
// レスポンシブ上書き（@layer main + @media）と正しくカスケードさせるため、
// 通常スタイルも必ず main レイヤーに入れる。
export const cssMain = genCssFn({ layer: "main" });

// レスポンシブ用 css（旧 panda の breakpoint 既定値）。@layer main + @media で出力する。
// 基準スタイルを cssMain で先に登録してから cx() で結合すると、min-width 一致時に上書きされる。
export const cssSm = genCssFn({ mediaAtRule: "min-width: 640px", layer: "main" }); // sm
export const cssMd = genCssFn({ mediaAtRule: "min-width: 768px", layer: "main" }); // md

// クラス名を結合する（falsy は除外）。
export function cx(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
}

// ============================================================
// リセット / グローバルスタイル（@layer base）
// ============================================================

// サイト全体の基本スタイル（リセット + body 背景・文字色・フォント・リンク）。
// css() は描画時に呼ばれた分だけがそのルートの CSS に出力されるため、
// 全ページが通る Layout の先頭で毎回呼び出す。
export function applyGlobalStyles(): void {
    // リセット（MUI の CssBaseline 相当）。
    css({ margin: "0", padding: "0", box_sizing: "border-box" }, { selector: "*", atrules: ["@layer base"] });
    css(
        { background_color: color.bg, color: color.fg, font_family: font.body, line_height: "1.6" },
        { selector: "html, body", atrules: ["@layer base"] },
    );
    css({ color: "inherit" }, { selector: "a", atrules: ["@layer base"] });
}
