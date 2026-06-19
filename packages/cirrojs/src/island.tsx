import { type ComponentProps, type ComponentType, createElement } from "react";
import { renderToString } from "react-dom/server";

// biome-ignore lint/suspicious/noExplicitAny: レジストリの値は任意 props のコンポーネント
type IslandRegistry = Record<string, ComponentType<any>>;

// 島レジストリから型安全な <Island> を生成するファクトリ。
// 島だけを renderToString（ハイドレーション用マーカー付き）し、dangerouslySetInnerHTML で埋め込む。
// これにより本文は renderToStaticMarkup（マーカーなし）に保てる。
// renderToString を含むこのモジュールはサーバー専用であり、クライアント（島マウンタ）は
// 純データの registry のみを import するため、クライアントバンドルには混入しない。
export function createIsland<R extends IslandRegistry>(islands: R) {
    return function Island<K extends keyof R & string>({ name, props, className }: { name: K; props: ComponentProps<R[K]>, className?: string }) {
        const html = renderToString(createElement(islands[name], props));
        return createElement("div", {
            className,
            "data-island": name,
            "data-props": JSON.stringify(props),
            // biome-ignore lint/security/noDangerouslySetInnerHtml: アイランドの初期DOMの注入
            dangerouslySetInnerHTML: { __html: html },
        });
    };
}
