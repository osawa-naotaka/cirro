import { createLayout } from "cirrojs/layout";
import { space } from "./system";

// Every Layout プリミティブ（cirrojs/layout）を、このサイトの既定値で束縛して提供する。
// 既定値は createLayout の引数で集中設定する（cirrojs 側のロジックはそのまま、起点だけを差し替える）。
// 出力は既定の @layer low に入り、recipes.ts の component レシピ（@layer main）が常に上書きできる。
export const { stack, cluster, center, grid, switcher, sidebar, Stack } = createLayout({
    defaults: {
        // 余白の大本。space スケールに合わせる（space(4) = "1rem"）。
        gap: space(4),
        // 中央コンテナの既定最大幅（Layout の共通コンテナで使う）。
        centerMax: "56rem",
    },
});
