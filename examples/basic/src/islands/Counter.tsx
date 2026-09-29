import { useState } from "react";
import { counterStyles } from "../styles";

// クライアントで動くリアクティブ要素（島）の最小例。
// スタイルは counterStyles() から無条件に受け取る。状態で分岐せずに全クラスを登録しておくことで、
// 初期 SSR 描画でこの島の CSS がすべて生成される（doc/05_STYLING.md 7.3）。
export function Counter({ initial = 0 }: { initial?: number }) {
    const [count, setCount] = useState(initial);
    const styles = counterStyles();

    return (
        <div className={styles.root}>
            <div>
                <div className={styles.label}>count</div>
                <div className={styles.count}>{count}</div>
            </div>
            <button type="button" className={styles.button} onClick={() => setCount((c) => c + 1)}>
                +1
            </button>
        </div>
    );
}
