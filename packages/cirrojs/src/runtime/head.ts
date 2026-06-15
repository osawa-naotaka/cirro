import { createElement, Fragment, type ReactElement } from "react";

// クライアントスクリプトをツリーに併置して返す。
// <head> を自前で探索する代わりに、React 19 のメタデータ巻き上げ（hoisting）を利用する。
// `<script async>` はツリーのどこに置いても React が <head> へ自動で巻き上げるため、
// ページが <html>/<head> を子コンポーネント（Layout 等）の奥に隠していても確実に <head> へ入る。
// 文字列置換は行わず、インラインスクリプトも生成しないため CSP 厳格性（script-src 'self'）を維持する。
//
// 注意:
// - 巻き上げを発火させるには `async` が必須。これにより module の実行は「文書順（defer）」から
//   「取得次第即実行（async）」に変わるが、島マウンタのエントリは 1 本なので順序問題は生じない。
// - 挿入位置は <head> の先頭（既存の <title> 等より前）になる。外部スクリプトのため実害はない。
export function appendClientScript(root: ReactElement, src: string): ReactElement {
    const script = createElement("script", { async: true, type: "module", src, key: "cirro-client" });
    return createElement(Fragment, null, root, script);
}
