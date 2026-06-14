import { useEffect, useState } from "react";

// 「ページ上部へ戻る」ボタン（クライアントで動く島）。
//
// あえて Material UI（emotion）を使わずプレーンな React + style 属性で実装している。
// 島は createIsland 内の renderToString で個別に描画されるため、ここで emotion を使うと
// 外側ページの renderToStaticMarkup とスタイル収集が二重になりうる。島を MUI 非依存に
// 保つことでその複雑さを避けつつ、クライアントスクリプトは外部 JS として配信される
// （script-src 'self' を維持）。
export function ScrollTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 300);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <button
            type="button"
            aria-label="ページ上部へ戻る"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
                position: "fixed",
                right: 24,
                bottom: 24,
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: "#1565c0",
                color: "#fff",
                fontSize: 22,
                lineHeight: 1,
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity .2s ease, transform .2s ease",
                pointerEvents: visible ? "auto" : "none",
            }}
        >
            ↑
        </button>
    );
}
