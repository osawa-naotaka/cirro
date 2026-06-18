import { createElement, Fragment, type ReactElement } from "react";

// クライアントスクリプトをツリーに併置して返す。
// <head> を自前で探索する代わりに、React 19 のメタデータ巻き上げ（hoisting）を利用する。
// `<script async>` はツリーのどこに置いても React が <head> へ自動で巻き上げるため、
// ページが <html>/<head> を子コンポーネント（Layout 等）の奥に隠していても確実に <head> へ入る。
// 文字列置換は行わず、インラインスクリプトも生成しないため CSP 厳格性（script-src 'self'）を維持する。
//
// 注意:
// - `<script>` の巻き上げを発火させるには `async` が必須。これにより module の実行は「文書順（defer）」から
//   「取得次第即実行（async）」に変わるが、島マウンタのエントリは 1 本なので順序問題は生じない。
// - `<link rel="stylesheet">` の巻き上げには `precedence` が必須。これを付けて初めて React は link を
//   単なる要素ではなく「スタイルシートリソース」として扱い、<head> へ巻き上げ・重複排除・順序管理する。
//   `precedence` が無いと link はツリー上の位置（= <body> 内）にそのまま残り、スタイル未適用の HTML が
//   一瞬表示される（FOUC）。出力には data-precedence 属性が残るが、無害なデータ属性で CSP にも影響しない。
// - 挿入位置は <head> の先頭（既存の <title> 等より前）になる。外部リソースのため実害はない。
export function appendClientScriptAndCss(root: ReactElement, jsSrc: string, cssSrc: string): ReactElement {
    const script = createElement("script", { async: true, type: "module", src: jsSrc, key: "cirro-client" });
    const css = createElement("link", { rel: "stylesheet", href: cssSrc, precedence: "default", key: "cirro-css" });
    return createElement(Fragment, null, root, script, css);
}
