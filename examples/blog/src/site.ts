import { defineSite } from "cirrojs";

// サイトメタデータ（sitemap / RSS / OGP が使う）。origin はデプロイ先の本番 URL を書く。
export const site = defineSite({
    origin: "https://blog.example.com",
    title: "Cirro Blog",
    description: "Cirro の examples/blog — Markdown と自前 CSS のブログ実例",
    lang: "ja",
});
