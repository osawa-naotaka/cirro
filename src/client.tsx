import { createElement } from "react";
import type { ComponentType } from "react";
import { hydrateRoot } from "react-dom/client";
import { Counter } from "./islands/Counter";

// 島レジストリ: data-island の名前 → コンポーネント
// biome-ignore lint/suspicious/noExplicitAny: プロトタイプ用の緩い props 型
const registry: Record<string, ComponentType<any>> = {
    counter: Counter,
};

// data-island を持つ要素だけを個別の root としてハイドレートする（島アーキテクチャ）。
// props は data-props 属性から JSON で読み取る（インラインスクリプトを使わない）。
for (const el of document.querySelectorAll<HTMLElement>("[data-island]")) {
    const name = el.dataset.island;
    if (!name) continue;
    const Component = registry[name];
    if (!Component) continue;
    const props = el.dataset.props ? JSON.parse(el.dataset.props) : {};
    hydrateRoot(el, createElement(Component, props));
}
