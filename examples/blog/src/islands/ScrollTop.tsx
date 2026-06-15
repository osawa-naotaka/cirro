import { useEffect, useState } from "react";
import { css } from "../../styled-system/css";

// 「ページ上部へ戻る」ボタン（クライアントで動く島）。
//
// 見た目はすべて Panda の css() で静的クラス化している。表示/非表示の切り替えも、
// 両方の状態を静的な css() で定義しておき className を差し替えるだけなので、
// クライアントで再レンダリングされても <style> やインライン style 属性を一切注入しない
// （style-src 'self' を維持）。クラスはビルド時に styles.css へ抽出される。
const base = css({
    position: "fixed",
    right: "6",
    bottom: "6",
    w: "12",
    h: "12",
    borderRadius: "full",
    border: "none",
    cursor: "pointer",
    bg: "primary",
    color: "white",
    fontSize: "xl",
    lineHeight: 1,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    transition: "opacity .2s ease, transform .2s ease",
});

const shown = css({ opacity: 1, transform: "translateY(0)", pointerEvents: "auto" });
const hidden = css({ opacity: 0, transform: "translateY(8px)", pointerEvents: "none" });

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
            className={`${base} ${visible ? shown : hidden}`}
        >
            ↑
        </button>
    );
}
