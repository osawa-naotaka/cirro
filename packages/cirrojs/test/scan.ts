import type { DefaultTreeAdapterMap } from "parse5";
import { parse } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];
type Template = DefaultTreeAdapterMap["template"];

export type Violation = {
    file: string;
    element: string;
    detail: string;
};

// CSP の `script-src 'self'` / `style-src 'self'` が禁じるインライン構成要素を検出する
// （15_TESTING.md 4.2 の V1〜V5）。違反ゼロが Cirro の生成物の保証である。
export function scanMarkup(markup: string, file: string): Violation[] {
    const violations: Violation[] = [];
    walk(parse(markup), (el) => {
        const tag = el.tagName.toLowerCase();

        // V1: src を持たない <script>（中身が空でも違反）
        if (tag === "script" && !el.attrs.some((a) => a.name.toLowerCase() === "src")) {
            violations.push({ file, element: tag, detail: "inline <script> (no src attribute)" });
        }

        // V4: <style> 要素
        if (tag === "style") {
            violations.push({ file, element: tag, detail: "<style> element" });
        }

        for (const attr of el.attrs) {
            const name = attr.name.toLowerCase();
            // V5: style 属性
            if (name === "style") {
                violations.push({ file, element: tag, detail: "style attribute" });
            } else if (name.startsWith("on")) {
                // V2: イベントハンドラ属性（onclick 等）
                violations.push({ file, element: tag, detail: `event handler attribute "${attr.name}"` });
            } else if (isUrlAttr(name) && isJavascriptUrl(attr.value)) {
                // V3: javascript: URL（CSP はインラインスクリプト扱いする）
                violations.push({ file, element: tag, detail: `javascript: URL in "${attr.name}"` });
            }
        }
    });
    return violations;
}

// 空振り防止（15_TESTING.md 4.3）: 島マウンタ等の外部スクリプトの本数
export function countExternalScripts(markup: string): number {
    let count = 0;
    walk(parse(markup), (el) => {
        if (el.tagName.toLowerCase() === "script" && el.attrs.some((a) => a.name.toLowerCase() === "src")) {
            count++;
        }
    });
    return count;
}

// 空振り防止（15_TESTING.md 4.3）: 外部スタイルシート <link rel="stylesheet"> の本数
export function countStylesheetLinks(markup: string): number {
    let count = 0;
    walk(parse(markup), (el) => {
        if (el.tagName.toLowerCase() === "link" && el.attrs.some((a) => a.name.toLowerCase() === "rel" && a.value.toLowerCase().trim() === "stylesheet")) {
            count++;
        }
    });
    return count;
}

// javascript: URL を持ちうる属性。SVG の xlink:href（parse5 の外来コンテンツ調整で
// prefix 付きの名前になりうる）も対象にする。
function isUrlAttr(name: string): boolean {
    return name === "href" || name === "src" || name === "action" || name === "formaction" || name.endsWith(":href");
}

// ブラウザはスキーム照合の前に制御文字・空白を無視するため、同じ寛容さで判定する。
function isJavascriptUrl(value: string): boolean {
    return (
        value
            // biome-ignore lint/suspicious/noControlCharactersInRegex: ブラウザが URL スキーム照合前に無視する制御文字を意図的に除去している
            .replace(/[\u0000-\u0020]/g, "")
            .toLowerCase()
            .startsWith("javascript:")
    );
}

function walk(node: Node, visit: (el: Element) => void): void {
    if ("tagName" in node) visit(node);
    if ("childNodes" in node) {
        for (const child of node.childNodes) walk(child, visit);
    }
    // <template> の中身は childNodes ではなく content 配下にぶら下がる
    if (node.nodeName === "template" && "content" in node) {
        walk((node as Template).content, visit);
    }
}
