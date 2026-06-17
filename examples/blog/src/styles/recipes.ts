import { color, cssMain, cx, fontSize, radii, space } from "./system";

// 旧 panda recipe を型付き関数へ移植したもの。
// css() は描画時に登録する必要があるため、recipe は呼び出すたびに css() を実行する
// （同一プロパティは同じクラス名になるので CSS は重複しても問題ない）。

// ============================================================
// button — クリック可能なボタン/リンクボタン（MUI の Button 相当）。
// ============================================================
export type ButtonVariant = "solid" | "outline" | "text" | "contrast";
export type ButtonSize = "sm" | "md";

export function button(opts?: { variant?: ButtonVariant; size?: ButtonSize }): string {
    const variant = opts?.variant ?? "text";
    const size = opts?.size ?? "md";

    const base = cssMain({
        display: "inline-flex",
        align_items: "center",
        justify_content: "center",
        gap: space(2),
        padding: `${space(2)} ${space(4)}`,
        font_size: fontSize.sm,
        font_weight: "600",
        line_height: "1.5",
        border_radius: radii.pill,
        border: "1px solid transparent",
        cursor: "pointer",
        text_decoration: "none",
        transition: "background-color .2s, box-shadow .2s, opacity .2s",
    });

    const sizeClass = size === "sm" ? cssMain({ padding: `${space(1.5)} ${space(3)}`, font_size: fontSize.xs }) : "";

    return cx(base, buttonVariant(variant), sizeClass);
}

function buttonVariant(variant: ButtonVariant): string {
    switch (variant) {
        // 塗りつぶし（プライマリ）。
        case "solid":
            return cx(
                cssMain({ background_color: color.primary, color: color.white }),
                cssMain({ background_color: color.primaryDark }, { selector: "&:hover" }),
            );
        // 枠線のみ。色は継承（ヒーロー上の白文字などに使う）。
        case "outline":
            return cx(
                cssMain({ border_color: "currentcolor", color: "inherit" }),
                cssMain({ background_color: color.whiteAlpha150 }, { selector: "&:hover" }),
            );
        // 濃い背景の上に置く反転ボタン（白地・プライマリ文字）。
        case "contrast":
            return cx(
                cssMain({ background_color: color.white, color: color.primary }),
                cssMain({ opacity: "0.85" }, { selector: "&:hover" }),
            );
        // テキストのみ（ナビゲーション等）。色は継承。
        default:
            return cx(
                cssMain({ color: "inherit" }),
                cssMain({ background_color: color.blackAlpha100 }, { selector: "&:hover" }),
            );
    }
}

// ============================================================
// chip — タグ等に使う小さなピル（MUI の Chip 相当）。
// ============================================================
export type ChipSize = "sm" | "md";

export function chip(opts?: { size?: ChipSize }): string {
    const size = opts?.size ?? "sm";

    const base = cssMain({
        display: "inline-flex",
        align_items: "center",
        border_radius: radii.pill,
        border: `1px solid ${color.primary}`,
        color: color.primary,
        background_color: "transparent",
        font_size: fontSize.xs,
        line_height: "1.6",
        padding: `${space(0.5)} ${space(2.5)}`,
        text_decoration: "none",
        transition: "background-color .2s",
    });
    const hover = cssMain({ background_color: color.hover }, { selector: "&:hover" });
    const sizeClass = size === "md" ? cssMain({ font_size: fontSize.sm, padding: `${space(1.5)} ${space(3)}` }) : "";

    return cx(base, hover, sizeClass);
}
