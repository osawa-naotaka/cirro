import type { ReactElement } from "react";
import type { ContentHandler } from "./content";

export type Params = Record<string, unknown>;

// 静的ルート: path は固定文字列
export type StaticRoute<T> = {
    type: "static";
    path: string;
    component: (props: { params: Record<string, never>; content: T }) => ReactElement;
};

// 動的ルート: path は params から URL を生成する関数（正規表現・特殊記法は使わない）
export type DynamicRoute<T, P extends Params = Params> = {
    type: "dynamic";
    path: (params: P) => string;
    getStaticPaths: (content: T) => P[];
    component: (props: { params: P; content: T }) => ReactElement;
};

// テキストファイルルート: path は固定文字列
export type FileRoute<T> = {
    type: "file";
    path: string;
    component: (props: { params: Record<string, never>; content: T }) => string;
};

// biome-ignore lint/suspicious/noExplicitAny: ルート集合では各動的ルートの params 型を消す必要がある
export type AnyRoute<T> = StaticRoute<T> | DynamicRoute<T, any> | FileRoute<T>;

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

export function createRoute<T = undefined>(content?: ContentHandler<T>) {
    function defineRoutes(...routes: AnyRoute<T>[]): { content?: ContentHandler<T>; routes: AnyRoute<T>[] } {
        return { content, routes };
    }

    function staticRoute(opt: Omit<StaticRoute<T>, "type">): StaticRoute<T> {
        return { type: "static", path: opt.path, component: opt.component };
    }

    function dynamicRoute<P extends Params>(opt: Omit<DynamicRoute<T, P>, "type">): DynamicRoute<T, P> {
        return { type: "dynamic", path: opt.path, getStaticPaths: opt.getStaticPaths, component: opt.component };
    }

    function fileRoute(opt: Omit<FileRoute<T>, "type">): FileRoute<T> {
        return { type: "file", path: opt.path, component: opt.component };
    }

    return { defineRoutes, staticRoute, dynamicRoute, fileRoute };
}
