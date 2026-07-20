import { useState } from "react";

// クライアントで閉じるリアクティブ要素（島）の最小例。
export function Counter({ initial = 0 }: { initial?: number }) {
    const [count, setCount] = useState(initial);
    return (
        <button type="button" onClick={() => setCount((c) => c + 1)}>
            count: {count}
        </button>
    );
}
