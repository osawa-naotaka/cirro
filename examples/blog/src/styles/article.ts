import type { Properties } from "cirrojs";
import { color, cssMain, font, radii, space } from "./system";

// Markdown 本文（renderMarkdown が返すサニタイズ済み HTML）のスタイル。
// 本文自身は要素を持たないため、コンテナクラスを基点とした子孫セレクタで各要素を整える。
// Prism（rehype-prism）が付与するトークンクラスの配色もここに含める。
// インライン style / style 属性は生成しない（style-src 'self' を維持）。
//
// css() は描画時に登録する必要があるため、ページ描画のたびに呼び出してコンテナクラスを返す。
export function articleClass(): string {
    const root = cssMain({
        color: color.fg,
        font_size: "1.05rem",
        line_height: "1.9",
        word_break: "break-word",
    });

    // "h2" や "ul, ol" のような（カンマ区切りを含む）子孫セレクタを ".root xxx" へ展開する。
    const d = (selector: string, properties: Properties): void => {
        const full = selector
            .split(",")
            .map((s) => `.${root} ${s.trim()}`)
            .join(", ");
        cssMain(properties, { selector: full });
    };

    d("h2", {
        margin_top: space(10),
        margin_bottom: space(4),
        font_size: "1.6rem",
        font_weight: "700",
        line_height: "1.4",
        scroll_margin_top: space(4),
    });
    d("h3", { margin_top: space(8), margin_bottom: space(3), font_size: "1.3rem", font_weight: "700", scroll_margin_top: space(4) });
    d("p", { margin_top: space(4), margin_bottom: space(4) });
    d("a", { color: color.primary, text_decoration: "underline" });
    d("ul, ol", { padding_left: space(6), margin_top: space(4), margin_bottom: space(4) });
    d("li", { margin_top: space(1), margin_bottom: space(1) });
    d("blockquote", {
        border_left: `4px solid ${color.primaryLight}`,
        background_color: color.hover,
        margin: "0",
        margin_top: space(6),
        margin_bottom: space(6),
        padding_left: space(5),
        padding_right: space(5),
        padding_top: space(2),
        padding_bottom: space(2),
        color: color.fgMuted,
    });
    d("code", {
        background_color: color.hover,
        padding_left: space(1.5),
        padding_right: space(1.5),
        padding_top: space(0.5),
        padding_bottom: space(0.5),
        border_radius: radii.sm,
        font_size: "0.9em",
        font_family: font.mono,
    });
    d("pre", {
        background_color: "#0f172a",
        color: "#e2e8f0",
        padding: space(5),
        border_radius: radii.card,
        overflow_x: "auto",
        margin_top: space(6),
        margin_bottom: space(6),
    });
    d("pre code", { background_color: "transparent", padding: "0", color: "inherit", font_size: "0.9rem" });

    // Prism トークンの配色。
    d(".token.comment, .token.prolog, .token.doctype, .token.cdata", { color: "#64748b", font_style: "italic" });
    d(".token.punctuation", { color: "#94a3b8" });
    d(".token.keyword, .token.attr-name, .token.rule", { color: "#c084fc" });
    d(".token.string, .token.attr-value, .token.char, .token.inserted", { color: "#86efac" });
    d(".token.number, .token.boolean, .token.constant, .token.tag, .token.deleted", { color: "#fca5a5" });
    d(".token.function, .token.property, .token.builtin", { color: "#7dd3fc" });
    d(".token.class-name, .token.selector", { color: "#fcd34d" });
    d(".token.operator", { color: "#e2e8f0" });

    d("table", { border_collapse: "collapse", width: "100%", margin_top: space(6), margin_bottom: space(6) });
    d("th, td", { border: `1px solid ${color.border}`, padding_left: space(3), padding_right: space(3), padding_top: space(2), padding_bottom: space(2), text_align: "left" });
    d("th", { background_color: color.hover, font_weight: "700" });
    d("img", { max_width: "100%", height: "auto", border_radius: radii.card });
    d("hr", { border: "0", border_top: `1px solid ${color.border}`, margin_top: space(8), margin_bottom: space(8) });

    return root;
}
