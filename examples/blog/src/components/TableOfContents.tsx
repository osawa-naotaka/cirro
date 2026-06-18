import type { ToC } from "cirrojs/server";
import { color, cssMain, cx, fontSize, space } from "../styles/system";

// remark-export-toc が抽出した目次（ToC[]）を描画する。各エントリの id は本文見出しの
// id と一致するため、アンカーリンク（#id）でジャンプできる。
//
// インデントは見出しレベル差から静的な css() クラスを選ぶ（インライン style を作らず
// style-src 'self' を維持する）。深さは 0〜3 に丸める。
export function TableOfContents({ toc }: { toc: ToC[] }) {
    if (toc.length === 0) return null;
    const minLevel = Math.min(...toc.map((item) => item.level));

    const nav = cssMain({
        font_size: fontSize.sm,
        border_left: `2px solid ${color.border}`,
        padding_left: space(4),
        margin_top: space(6),
        margin_bottom: space(6),
    });
    const heading = cssMain({ font_size: fontSize.xs, font_weight: "700", color: color.fgMuted, text_transform: "uppercase", letter_spacing: "0.05em", margin_bottom: space(2) });
    const link = cx(
        cssMain({ color: color.fgMuted, text_decoration: "none" }),
        cssMain({ color: color.primary, text_decoration: "underline" }, { selector: "&:hover" }),
    );
    const indent = [cssMain({ padding_left: space(0) }), cssMain({ padding_left: space(3) }), cssMain({ padding_left: space(6) }), cssMain({ padding_left: space(9) })];

    return (
        <nav className={nav} aria-label="目次">
            <p className={heading}>目次</p>
            <ul className={cssMain({ display: "flex", flex_direction: "column", gap: space(1), list_style: "none", margin: "0", padding: "0" })}>
                {toc.map((item) => (
                    <li key={item.id} className={indent[Math.min(item.level - minLevel, indent.length - 1)]}>
                        <a href={`#${item.id}`} className={link}>
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
