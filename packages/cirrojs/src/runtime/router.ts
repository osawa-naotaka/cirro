import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { ReactElement } from "react";
import type { AnyRoute } from "../lib/route";

export type ResolvedPath =
    | {
          type: "html";
          path: string;
          render: () => ReactElement;
      }
    | {
          type: "css";
          path: string;
          render: () => ReactElement;
      }
    | {
          type: "file";
          path: string;
          ext: string;
          render: () => string;
      }
    | {
          type: "asset";
          path: string;
          ext: string;
          render: () => string;
      };

// 全ルートを具体的な URL 一覧へ展開する（build / dev で共有）。
// 動的ルートは getStaticPaths を path 関数に通して URL を生成するため、正規表現は不要。
export function expandRoutes<T>(routes: AnyRoute<T>[], _assetsUrl: string, content: T): ResolvedPath[] {
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

    // fontawesome assetsUrl
    for (const t of ["brands", "regular", "solid"]) {
        pages.push({
            type: "asset",
            path: `/fa/${t}.svg`,
            ext: ".svg",
            render: () => {
                const require = createRequire(import.meta.url);
                const path = require.resolve(`@fortawesome/fontawesome-free/sprites/${t}.svg`);
                const svg = readFileSync(path, "utf-8");
                return svg;
            },
        });
    }
    return pages;
}

function extname(path: string): string {
    const base = path.slice(path.lastIndexOf("/") + 1);
    const dot = base.lastIndexOf(".");
    // 先頭ドット（dotfile）は拡張子扱いしない
    return dot > 0 ? base.slice(dot) : "";
}
