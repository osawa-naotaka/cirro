import type { Params } from "./route";

export type ContentHandler<T> = {
    loader: () => Promise<T>;
};

export function defineContent<T>({ loader }: ContentHandler<T>): ContentHandler<T> {
    return { loader };
}

// cirrojs/src/content.ts — ContentType は「中身の型」に戻す(純粋な型抽出)
export type ContentType<H> = H extends ContentHandler<infer U> ? U : undefined;

// ページ props 用ヘルパーを別に用意する(route.ts か content.ts に)
export type PageProps<H, P extends Params = Record<string, never>> = {
    params: P;
    content: ContentType<H>;
};
