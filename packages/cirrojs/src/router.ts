import { extname } from "node:path";
import type { ReactElement } from "react";
// import { join } from "node:path";

export type Params = Record<string, string>;

// 静的ルート: path は固定文字列
export type StaticRoute = {
    type: "static";
    path: string;
    component: (props: { params: Record<string, never> }) => ReactElement;
};

// 動的ルート: path は params から URL を生成する関数（正規表現・特殊記法は使わない）
export type DynamicRoute<P extends Params = Params> = {
    type: "dynamic";
    path: (params: P) => string;
    cssPath: string;
    getStaticPaths: () => P[];
    component: (props: { params: P }) => ReactElement;
};

// テキストファイルルート: path は固定文字列
export type FileRoute = {
    type: "file";
    path: string;
    component: (props: { params: Record<string, never> }) => string;
};

// biome-ignore lint/suspicious/noExplicitAny: ルート集合では各動的ルートの params 型を消す必要がある
export type AnyRoute = StaticRoute | DynamicRoute<any> | FileRoute;

// 動的ルートの型パラメータ P を保持するための型推論ヘルパー。
export function route<P extends Params>(def: DynamicRoute<P>): DynamicRoute<P>;
export function route(def: StaticRoute): StaticRoute;
export function route(def: FileRoute): FileRoute;
export function route(def: AnyRoute): AnyRoute {
    return def;
}

// export type ResolvedPage = { url: string; isCss: boolean; cssPath: string; render: () => ReactElement };

export type ResolvedPath = {
    type: "html";
    path: string;
    cssPath: string;
    render: () => ReactElement;
} | {
    type: "css";
    path: string;
    render: () => ReactElement;
} | {
    type: "file";
    path: string;
    ext: string;
    render: () => string;
}

// 全ルートを具体的な URL 一覧へ展開する（build / dev で共有）。
// 動的ルートは getStaticPaths を path 関数に通して URL を生成するため、正規表現は不要。
export function expandRoutes(routes: AnyRoute[]): ResolvedPath[] {
    const pages: ResolvedPath[] = [];
    for (const r of routes) {
        switch (r.type) {
            case "static":
                pages.push({
                    type: "html",
                    path: r.path,
                    cssPath: join(r.path, "index.css"),
                    render: () => r.component({ params: {} }),
                });
                pages.push({
                    type: "css",
                    path: join(r.path, "index.css"),
                    render: () => r.component({ params: {} }),
                })
                break;
            case "dynamic":
                for (const params of r.getStaticPaths()) {
                    pages.push({
                        type: "html",
                        path: r.path(params),
                        cssPath: r.cssPath,
                        render: () => r.component({ params }),
                    });
                }
                pages.push({
                    type: "css",
                    path: r.cssPath,
                    render: () => r.component({ params: r.getStaticPaths()[0] }),
                })
                break;
            case "file":
                pages.push({
                    type: "file",
                    path: r.path,
                    ext: extname(r.path),
                    render: () => r.component({ params: {} }),
                })
                break;
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

function join(...paths: string[]): string {
    return paths.reduce(
        (p, c) => (p.endsWith("/") && c.startsWith("/") ? `${p}${c.substring(1)}` : p.endsWith("/") || c.startsWith("/") ? `${p}${c}` : `${p}/${c}`),
        "",
    );
}
