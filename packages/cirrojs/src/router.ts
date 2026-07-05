import { extname } from "node:path";
import type { AnyRoute, DynamicRoute, FileRoute, Params, ResolvedPath, StaticRoute } from "./route";

// 動的ルートの型パラメータ P を保持するための型推論ヘルパー。
export function route<T, P extends Params>(def: DynamicRoute<T, P>): DynamicRoute<T, P>;
export function route<T>(def: StaticRoute<T>): StaticRoute<T>;
export function route<T>(def: FileRoute<T>): FileRoute<T>;
export function route<T>(def: AnyRoute<T>): AnyRoute<T> {
    return def;
}

// 全ルートを具体的な URL 一覧へ展開する（build / dev で共有）。
// 動的ルートは getStaticPaths を path 関数に通して URL を生成するため、正規表現は不要。
export function expandRoutes<T>(routes: AnyRoute<T>[], content: T): ResolvedPath[] {
    const pages: ResolvedPath[] = [];
    for (const r of routes) {
        switch (r.type) {
            case "static":
                pages.push({
                    type: "html",
                    path: r.path,
                    render: () => r.component({ params: {}, content }),
                });
                pages.push({
                    type: "css",
                    path: `${r.path}.css`,
                    render: () => r.component({ params: {}, content }),
                });
                break;
            case "dynamic":
                for (const params of r.getStaticPaths(content)) {
                    const path = r.path(params);
                    pages.push({
                        type: "html",
                        path,
                        render: () => r.component({ params, content }),
                    });
                    pages.push({
                        type: "css",
                        path: `${path}.css`,
                        render: () => r.component({ params, content }),
                    });
                }
                break;
            case "file":
                pages.push({
                    type: "file",
                    path: r.path,
                    ext: extname(r.path),
                    render: () => r.component({ params: {}, content }),
                });
                break;
        }
    }
    return pages;
}
