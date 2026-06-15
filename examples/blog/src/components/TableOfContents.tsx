import type { ToC } from "cirrojs";
import { css } from "../../styled-system/css";

// remark-export-toc が抽出した目次（ToC[]）を描画する。各エントリの id は本文見出しの
// id と一致するため、アンカーリンク（#id）でジャンプできる。
//
// インデントは見出しレベル差から静的な Panda クラスを選ぶ（インライン style を作らず
// style-src 'self' を維持する）。深さは 0〜3 に丸める。
const nav = css({
    fontSize: "sm",
    borderLeft: "2px solid token(colors.border)",
    pl: "4",
    my: "6",
});
const heading = css({ fontSize: "xs", fontWeight: 700, color: "fg.muted", textTransform: "uppercase", letterSpacing: "wider", mb: "2" });
const link = css({ color: "fg.muted", textDecoration: "none", _hover: { color: "primary", textDecoration: "underline" } });
const indent = [css({ pl: "0" }), css({ pl: "3" }), css({ pl: "6" }), css({ pl: "9" })];

export function TableOfContents({ toc }: { toc: ToC[] }) {
    if (toc.length === 0) return null;
    const minLevel = Math.min(...toc.map((item) => item.level));

    return (
        <nav className={nav} aria-label="目次">
            <p className={heading}>目次</p>
            <ul className={css({ display: "flex", flexDir: "column", gap: "1", listStyle: "none", m: "0", p: "0" })}>
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
