import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { islands } from "./islands/registry";

// data-island を持つ要素だけを個別の root としてハイドレートする（島アーキテクチャ）。
// 島の名前は共有レジストリ (islands/registry.ts) で解決する。
// props は data-props 属性から JSON で読み取る（インラインスクリプトを使わない）。
for (const el of document.querySelectorAll<HTMLElement>("[data-island]")) {
    const name = el.dataset.island;
    if (!name || !(name in islands)) continue;
    const Component = islands[name as keyof typeof islands];
    const props = el.dataset.props ? JSON.parse(el.dataset.props) : {};
    hydrateRoot(el, createElement(Component, props));
}
