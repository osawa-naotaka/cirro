import { at, genCssFn, ss, toStyle } from "cirrojs";
import { createLayout, cx, defineCascadeLayer, resetCss } from "cirrojs/layout";

// このサンプルのデザインシステム（トークン / css ヘルパー / レシピ）を 1 ファイルにまとめたもの。
// スタイルは Cirro 自前の CSS 生成（doc/05_STYLING.md）で書く。クラス名は型付き関数から得るので
// 文字列のクラス名を手書きすることはなく、<style> も style="" も一切生成されない（style-src 'self'）。

// ============================================================
// デザイントークン
// ============================================================

export const color = {
    accent: "#4f46e5",
    accentDark: "#4338ca",
    accentSoft: "#eef2ff",
    // ヒーローの背景（外部画像を読まず CSS のグラデーションだけで作る）。
    accentGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #a855f7 100%)",
    bg: "#f8fafc",
    surface: "#ffffff",
    fg: "#0f172a",
    fgMuted: "#64748b",
    border: "#e2e8f0",
    white: "#ffffff",
    whiteAlpha150: "rgba(255, 255, 255, 0.15)",
    whiteAlpha250: "rgba(255, 255, 255, 0.25)",
} as const;

export const fontSize = {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.375rem",
    "2xl": "1.75rem",
    "3xl": "2.25rem",
} as const;

export const radii = {
    md: "10px",
    lg: "18px",
    pill: "999px",
} as const;

export const shadow = {
    card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 30px -18px rgba(15, 23, 42, 0.45)",
    hero: "0 20px 45px -25px rgba(79, 70, 229, 0.8)",
} as const;

// 外部フォントを読まない（font-src 'self' を保つ）。
export const fontFamily = [
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    '"Hiragino Sans"',
    '"Noto Sans JP"',
    "Meiryo",
    "sans-serif",
].join(", ");

// 間隔スケール（space(4) = "1rem"）。
export function space(n: number): string {
    return `${n * 0.25}rem`;
}

// ============================================================
// css ヘルパー / レイアウトプリミティブ
// ============================================================

// 通常のコンポーネントスタイルは必ず @layer main に入れる。レイヤー無しで出力すると
// @layer 付きのどのスタイルよりも優先され、カスケードが壊れるため。
export const cssMain = genCssFn((inject) => at("@layer main", inject()));

// 画面が広いときだけ効くスタイル（@layer main + @media）。cssMain と cx() で結合して使う。
export const cssPc = genCssFn((inject) => at("@layer main", at("@media (min-width: 40rem)", inject())));

// Every Layout のプリミティブ（@layer low）をこのサイトの既定値で束縛する。
export const { stack, cluster, center, grid } = createLayout({
    defaults: { gap: space(4), centerMax: "52rem" },
});

export { cx };

// ============================================================
// グローバルスタイル（@layer base）
// ============================================================

// css() は描画時に呼ばれた分だけがそのルートの CSS に出力されるため、
// 全ページが通る Layout の先頭で毎回呼び出す。
export function applyGlobalStyles(): void {
    defineCascadeLayer();
    resetCss();

    toStyle(
        at(
            "@layer base",
            ss(
                { background_color: color.bg, color: color.fg, font_family: fontFamily, font_size: fontSize.md, line_height: "1.75" },
                { selector: "html, body" },
            ),
        ),
    );
    // フッターを最下部に張り付ける（コンテンツが短いページでも下端に来る）。
    toStyle(at("@layer base", ss({ display: "flex", flex_direction: "column", min_height: "100vh" }, { selector: "body" })));
    // リセットが font: inherit で見出しの太字も落とすため、ここで戻す（サイズは各所で指定する）。
    toStyle(at("@layer base", ss({ font_weight: "700", line_height: "1.3", letter_spacing: "-0.01em" }, { selector: "h1, h2, h3" })));
    // リセットで border を消しているぶん、キーボード操作の可視性はここで担保する。
    toStyle(at("@layer base", ss({ outline: `2px solid ${color.accent}`, outline_offset: "2px" }, { selector: ":focus-visible" })));
}

// ============================================================
// レシピ（見た目のまとまり。@layer main）
// ============================================================

// 横幅を制限して中央寄せする共通コンテナ。
export function container(): string {
    return center({ gutters: space(5) });
}

// 白いカード。セクションの本体に使う。
export function card(opts?: { padding?: string }): string {
    return cssMain({
        background_color: color.surface,
        border: `1px solid ${color.border}`,
        border_radius: radii.lg,
        box_shadow: shadow.card,
        padding: opts?.padding ?? space(6),
    });
}

// 小さなラベル（ピル）。tone で色を変える。
export function badge(opts?: { tone?: "accent" | "onDark" }): string {
    const base = cssMain({
        display: "inline-flex",
        align_items: "center",
        // 縦積み（stack）の中でも幅いっぱいに伸びないよう、自分の幅で止める。
        align_self: "flex-start",
        gap: space(2),
        border_radius: radii.pill,
        font_size: fontSize.xs,
        font_weight: "600",
        letter_spacing: "0.04em",
        padding: `${space(1)} ${space(3)}`,
    });
    const tone =
        opts?.tone === "onDark"
            ? cssMain({ background_color: color.whiteAlpha250, color: color.white })
            : cssMain({ background_color: color.accentSoft, color: color.accentDark });
    return cx(base, tone);
}

export type ButtonVariant = "solid" | "ghost" | "contrast" | "outline";

// ボタン / リンクボタン。<button> にも <a>（Link）にも当てられる。
export function button(opts?: { variant?: ButtonVariant }): string {
    const base = cssMain({
        display: "inline-flex",
        align_items: "center",
        justify_content: "center",
        gap: space(2),
        border: "1px solid transparent",
        border_radius: radii.pill,
        font_size: fontSize.sm,
        font_weight: "600",
        line_height: "1.5",
        padding: `${space(2)} ${space(4)}`,
        text_decoration: "none",
        transition: "background-color .15s, color .15s, box-shadow .15s, transform .15s",
    });
    return cx(base, buttonVariant(opts?.variant ?? "ghost"));
}

function buttonVariant(variant: ButtonVariant): string {
    switch (variant) {
        // 主要な操作。塗りつぶし。
        case "solid":
            return cx(
                cssMain({ background_color: color.accent, color: color.white, box_shadow: "0 6px 16px -8px rgba(79, 70, 229, 0.9)" }),
                cssMain({ background_color: color.accentDark }, { selector: "$:hover" }),
            );
        // 濃い背景（ヒーロー）の上の副次ボタン。色は親から継承する。
        case "outline":
            return cx(cssMain({ border_color: "currentcolor", color: "inherit" }), cssMain({ background_color: color.whiteAlpha150 }, { selector: "$:hover" }));
        // 濃い背景（ヒーロー）の上に置く反転ボタン。
        case "contrast":
            return cx(
                cssMain({ background_color: color.white, color: color.accentDark }),
                cssMain({ background_color: color.accentSoft }, { selector: "$:hover" }),
            );
        // ナビゲーション等。既定。
        default:
            return cx(cssMain({ color: color.fgMuted }), cssMain({ background_color: color.accentSoft, color: color.accentDark }, { selector: "$:hover" }));
    }
}

// 本文中のリンク。
export function textLink(): string {
    return cx(
        cssMain({ color: color.accent, font_weight: "600", text_decoration: "underline", text_underline_offset: "0.2em" }),
        cssMain({ color: color.accentDark }, { selector: "$:hover" }),
    );
}

// ページの主題（h1）。画面幅で 1 要素の値だけが変わるので cssPc を重ねる。
export function pageTitle(): string {
    return cx(cssMain({ font_size: fontSize["2xl"] }), cssPc({ font_size: fontSize["3xl"] }));
}

// セクション見出し（h2）。
export function sectionTitle(): string {
    return cssMain({ font_size: fontSize.xl });
}

// 導入文（本文より少し大きい）。
export function lead(): string {
    return cssMain({ color: color.fgMuted, font_size: fontSize.lg });
}

// 補足テキスト。
export function muted(): string {
    return cssMain({ color: color.fgMuted, font_size: fontSize.sm });
}

// 本文中のコード片。リセットが font: inherit を当てるので等幅フォントはここで指定する。
export function code(): string {
    return cssMain({
        background_color: color.accentSoft,
        border_radius: radii.md,
        color: color.accentDark,
        font_family: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        font_size: fontSize.sm,
        padding: `${space(0.5)} ${space(1.5)}`,
    });
}

// ============================================================
// 島（Counter）のスタイル
// ============================================================

// 島の中のスタイル登録は初期 SSR 描画で必ず走る必要がある（doc/05_STYLING.md 7.3）。
// クラス名を返す関数として切り出しておけば、状態にかかわらず無条件に登録できる。
export function counterStyles(): { root: string; label: string; count: string; button: string } {
    return {
        root: cx(
            cluster({ gap: space(4), justify: "space-between" }),
            cssMain({
                background_color: color.accentSoft,
                border: `1px solid ${color.border}`,
                border_radius: radii.md,
                padding: `${space(3)} ${space(4)}`,
            }),
        ),
        label: cssMain({ color: color.fgMuted, font_size: fontSize.sm, font_weight: "600" }),
        count: cssMain({ color: color.accentDark, font_size: fontSize["2xl"], font_weight: "700", font_variant_numeric: "tabular-nums" }),
        button: button({ variant: "solid" }),
    };
}
