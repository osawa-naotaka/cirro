import type { ReactElement } from "react";

export type Params = Record<string, unknown>;

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
      };

export function defineRoutes(...routes: AnyRoute[]): AnyRoute[] {
    return routes;
}

export function staticRoute(opt: Omit<StaticRoute, "type">): StaticRoute {
    return { type: "static", path: opt.path, component: opt.component };
}

export function dynamicRoute<P extends Params>(opt: Omit<DynamicRoute<P>, "type">): DynamicRoute<P> {
    return { type: "dynamic", path: opt.path, getStaticPaths: opt.getStaticPaths, component: opt.component };
}

export function fileRoute(opt: Omit<FileRoute, "type">): FileRoute {
    return { type: "file", path: opt.path, component: opt.component };
}
