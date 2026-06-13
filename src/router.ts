import type { ReactElement } from "react";

export type Params = Record<string, string>;

// 静的ルート: path は固定文字列
export type StaticRoute = {
    path: string;
    component: (props: { params: Record<string, never> }) => ReactElement;
};

// 動的ルート: path は params から URL を生成する関数（正規表現・特殊記法は使わない）
export type DynamicRoute<P extends Params = Params> = {
    path: (params: P) => string;
    getStaticPaths: () => P[];
    component: (props: { params: P }) => ReactElement;
};

export type AnyRoute = StaticRoute | DynamicRoute<Params>;

// 動的ルートの型パラメータ P を保持するための型推論ヘルパー。
export function route<P extends Params>(def: DynamicRoute<P>): DynamicRoute<P>;
export function route(def: StaticRoute): StaticRoute;
export function route(def: AnyRoute): AnyRoute {
    return def;
}

export type ResolvedPage = { url: string; render: () => ReactElement };

// 全ルートを具体的な URL 一覧へ展開する（build / dev で共有）。
// 動的ルートは getStaticPaths を path 関数に通して URL を生成するため、正規表現は不要。
export function expandRoutes(routes: AnyRoute[]): ResolvedPage[] {
    const pages: ResolvedPage[] = [];
    for (const r of routes) {
        if (typeof r.path === "string") {
            const staticRoute = r;
            pages.push({ url: staticRoute.path, render: () => staticRoute.component({ params: {} }) });
        } else {
            const dynamicRoute = r;
            for (const params of dynamicRoute.getStaticPaths()) {
                pages.push({ url: dynamicRoute.path(params), render: () => dynamicRoute.component({ params }) });
            }
        }
    }
    return pages;
}

// クリーン URL → 出力ファイルパス（"/" は index.html、"/about" は about/index.html）。
export function urlToFilePath(url: string): string {
    if (url === "/") return "index.html";
    return `${url.replace(/^\/+|\/+$/g, "")}/index.html`;
}
