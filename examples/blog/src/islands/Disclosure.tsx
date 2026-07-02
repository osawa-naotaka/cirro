import { styleSample } from "cirrojs";
import { type ReactNode, useState } from "react";
import { color, cssMain, fontSize, radii, space } from "../styles/system";

// 折りたたみ表示（クライアントで動く島）。styleSample() の手本。
//
// DisclosurePanel は初期状態（open=false）では描画されないため、そのままではパネル内の css() が
// 初期 SSR 描画で一度も実行されず、CSS が生成されない（05_STYLING.md 7.3 の破綻例）。
// styleSample() へサンプル要素を渡しておくと、本描画の完了後にサーバー側でだけレンダリングされ、
// パネルとその子孫コンポーネントの css() が漏れなく収集される。クライアントでは no-op。
//
// 注意: DisclosurePanel({ ... }) のような直接呼び出しでは代わりにならない。直接呼び出しは
// 関数本体しか実行せず、返り値の JSX 内の子コンポーネントは実行されない。また呼び先にフックが
// あると呼び出し元の hook 列に混ざる。styleSample() は独立したレンダリングルートなのでどちらの
// 問題もない。
export function Disclosure({ summary, detail }: { summary: string; detail: string }) {
    const [open, setOpen] = useState(false);

    styleSample(<DisclosurePanel detail={detail} />);

    const toggle = cssMain({
        display: "block",
        width: "100%",
        padding: space(3),
        border: `1px solid ${color.border}`,
        border_radius: radii.card,
        background_color: color.bg,
        font_size: fontSize.md,
        text_align: "left",
        cursor: "pointer",
    });

    return (
        <div>
            <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={toggle}>
                {open ? "▼" : "▶"} {summary}
            </button>
            {open && <DisclosurePanel detail={detail} />}
        </div>
    );
}

// 開いたときに初めてマウントされるパネル。css() はこのコンポーネントが実行されて初めて登録される。
function DisclosurePanel({ detail }: { detail: string }): ReactNode {
    const panel = cssMain({
        padding: space(4),
        margin_top: space(2),
        border_radius: radii.card,
        background_color: color.hover,
        font_size: fontSize.sm,
        color: color.fgMuted,
        line_height: "1.9",
    });

    return <p className={panel}>{detail}</p>;
}
