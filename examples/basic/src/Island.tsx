import { type ComponentProps, createElement } from "react";
import { renderToString } from "react-dom/server";
import { type Islands, islands } from "./islands/registry";

// フレームワーク提供のサーバー専用コンポーネント。
// 島だけを renderToString（ハイドレーション用マーカー付き）し、その HTML を
// ラッパー要素に dangerouslySetInnerHTML で埋め込む。
// これにより Page 全体は renderToStaticMarkup（マーカーなし）で描画でき、
// 本文は純粋な静的 HTML、島の中だけマーカー付きにできる。
export function Island<K extends keyof Islands>({ name, props }: { name: K; props: ComponentProps<Islands[K]> }) {
    const html = renderToString(createElement(islands[name] as never, props as never));
    return createElement("div", {
        "data-island": name,
        "data-props": JSON.stringify(props),
        dangerouslySetInnerHTML: { __html: html },
    });
}
