import { useEffect, useState } from "react";
import { color, cssMain, cx, fontSize, radii, space } from "../styles/system";

// 「ページ上部へ戻る」ボタン（クライアントで動く島）。
//
// 見た目はすべて css() で静的クラス化している。表示/非表示の切り替えも、両方の状態を
// 静的な css() で定義しておき className を差し替えるだけなので、クライアントで再レンダリング
// されても <style> やインライン style 属性を一切注入しない（style-src 'self' を維持）。
// クラスの実体（CSS）は島の SSR 時にルートの CSS へ登録される。
//
// css() は描画時に登録する必要があるため、クラス定義はコンポーネント内で行う
// （SSR の renderToString 時に登録される。クライアントでは同じクラス名を返すだけ）。
export function ScrollTop() {
    const [visible, setVisible] = useState(false);

    const base = cssMain({
        position: "fixed",
        right: space(6),
        bottom: space(6),
        width: space(12),
        height: space(12),
        border_radius: radii.full,
        border: "none",
        cursor: "pointer",
        background_color: color.primary,
        color: color.white,
        font_size: fontSize.xl,
        line_height: "1",
        box_shadow: "0 4px 12px rgba(0,0,0,0.25)",
        transition: "opacity .2s ease, transform .2s ease",
    });
    const shown = cssMain({ opacity: "1", transform: "translateY(0)", pointer_events: "auto" });
    const hidden = cssMain({ opacity: "0", transform: "translateY(8px)", pointer_events: "none" });

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
            className={cx(base, visible ? shown : hidden)}
        >
            ↑
        </button>
    );
}
