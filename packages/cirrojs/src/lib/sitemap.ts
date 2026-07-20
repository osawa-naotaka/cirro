import { htmlPagePaths, requireSite } from "cirrojs/registry";
import { escapeXml, join } from "./misc.ts";

export type SitemapOpt = {
    // クリーン URL の path を受け取り、false を返したページを sitemap から除外する。
    filter?: (path: string) => boolean;
};

// sitemap のファイルルート用コンポーネントを作る（12_SITE_METADATA.md 4.4）。
//
//     route({ type: "file", path: "/sitemap.xml", component: sitemapXml() })
//
// 収録対象は静的・動的ルートの全展開 URL（クリーン URL 正規形）。ファイルルート・合成ルート・
// public 配下は収録しない。lastmod / changefreq / priority は出力しない（信頼できる情報源が
// なく、不正確な lastmod は無いより悪い）。順序は expandRoutes の展開順（決定的）。
export function sitemapXml(opt?: SitemapOpt): () => string {
    return () => {
        const site = requireSite("sitemapXml()");
        const paths = htmlPagePaths().filter(opt?.filter ?? (() => true));
        if (site === null) {
            // 違反は収集済み。dev は警告、build はまとめて報告して非ゼロ終了する。
            return "";
        }

        const urls = paths.map((p) => `    <url><loc>${escapeXml(join(site.origin + p))}</loc></url>`);
        return [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, ...urls, `</urlset>`, ``].join("\n");
    };
}
