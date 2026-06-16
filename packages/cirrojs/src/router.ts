import type { ReactElement } from "react";
import { resolve } from "node:path";

export type Params = Record<string, string>;

// 静的ルート: path は固定文字列
export type StaticRoute = {
    path: string;
    component: (props: { params: Record<string, never> }) => ReactElement;
};

// 動的ルート: path は params から URL を生成する関数（正規表現・特殊記法は使わない）
export type DynamicRoute<P extends Params = Params> = {
    path: (params: P) => string;
    cssPath: string;
    getStaticPaths: () => P[];
    component: (props: { params: P }) => ReactElement;
};

// biome-ignore lint/suspicious/noExplicitAny: ルート集合では各動的ルートの params 型を消す必要がある
export type AnyRoute = StaticRoute | DynamicRoute<any>;

// 動的ルートの型パラメータ P を保持するための型推論ヘルパー。
export function route<P extends Params>(def: DynamicRoute<P>): DynamicRoute<P>;
export function route(def: StaticRoute): StaticRoute;
export function route(def: AnyRoute): AnyRoute {
    return def;
}

export type ResolvedPage = { url: string; isCss: boolean; render: () => ReactElement };

// 全ルートを具体的な URL 一覧へ展開する（build / dev で共有）。
// 動的ルートは getStaticPaths を path 関数に通して URL を生成するため、正規表現は不要。
export function expandRoutes(routes: AnyRoute[]): ResolvedPage[] {
    const pages: ResolvedPage[] = [];
    for (const r of routes) {
        if ("getStaticPaths" in r) {
            for (const params of r.getStaticPaths()) {
                pages.push({ url: r.path(params), isCss: false, render: () => r.component({ params }) });
            }
            pages.push({ url: r.cssPath, isCss: true, render: () => r.component({ params: r.getStaticPaths()[0] }) })
        } else {
            pages.push({ url: r.path, isCss: false, render: () => r.component({ params: {} }) });
            pages.push({ url: resolve(r.path, "index.css"), isCss: true, render: () => r.component({ params: {} }) });
        }
    }
    return pages;
}

// クリーン URL → 出力ファイルパス（"/" は index.html、"/about" は about/index.html）。
export function urlToFilePath(url: string): string {
    if (url === "/") return "index.html";
    return `${url.replace(/^\/+|\/+$/g, "")}/index.html`;
}

export function urlToCssFilePath(url: string): string {
    if (url === "/") return "index.css";
    return `${url.replace(/^\/+|\/+$/g, "")}`;
}
