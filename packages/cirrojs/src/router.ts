import { extname } from "node:path";
import type { AnyRoute, DynamicRoute, FileRoute, Params, ResolvedPath, StaticRoute } from "./route";

// 動的ルートの型パラメータ P を保持するための型推論ヘルパー。
export function route<P extends Params>(def: DynamicRoute<P>): DynamicRoute<P>;
export function route(def: StaticRoute): StaticRoute;
export function route(def: FileRoute): FileRoute;
export function route(def: AnyRoute): AnyRoute {
    return def;
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
                    cssPath: r.cssPath,
                    render: () => r.component({ params: {} }),
                });
                pages.push({
                    type: "css",
                    path: r.cssPath,
                    render: () => r.component({ params: {} }),
                });
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
                });
                break;
            case "file":
                pages.push({
                    type: "file",
                    path: r.path,
                    ext: extname(r.path),
                    render: () => r.component({ params: {} }),
                });
                break;
        }
    }
    return pages;
}
