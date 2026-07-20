import type { ReactElement } from "react";
import type { ContentHandler } from "./content";
import type { Site } from "./site";

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

export type CreateRouteFnOpt<T> = {
    content?: ContentHandler<T>;
    site?: Site;
};

export function createRouteFn<T = undefined>(opt?: CreateRouteFnOpt<T>) {
    // 旧シグネチャ createRouteFn(content) からの移行ガード（型を無視した JS 利用者向け）。
    if (opt && "loader" in opt) {
        throw new Error("cirro: createRouteFn(content) was changed to createRouteFn({ content }). Pass an options object instead.");
    }
    const content = opt?.content;
    const site = opt?.site;

    function defineRoutes(...routes: AnyRoute<T>[]): { content?: ContentHandler<T>; site?: Site; routes: AnyRoute<T>[] } {
        return { content, site, routes };
    }

    // 動的ルートの型パラメータ P を保持するための型推論ヘルパー。
    function route<P extends Params>(def: DynamicRoute<T, P>): DynamicRoute<T, P>;
    function route(def: StaticRoute<T>): StaticRoute<T>;
    function route(def: FileRoute<T>): FileRoute<T>;
    function route(def: AnyRoute<T>): AnyRoute<T> {
        return def;
    }

    return { defineRoutes, route };
}
