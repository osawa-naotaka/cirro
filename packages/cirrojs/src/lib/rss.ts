import { checkLink, reportMissingSiteConfig, requireSite } from "cirrojs/registry";
import { escapeXml } from "./xml.ts";

export type RssItem = {
    title: string;
    // ルート相対パス。Link と同じレールで存在がビルド時に検証される。
    path: string;
    // pubDate として出力（Date#toUTCString の RFC 1123 形式）。
    date: Date;
    description?: string;
};

export type RssOpt = {
    items: RssItem[];
    // channel title。既定 site.title。
    title?: string;
    // channel description。既定 site.description（どちらも無ければ違反として報告）。
    description?: string;
    // channel language。既定 site.lang（どちらも無ければ省略）。
    lang?: string;
};

// RSS 2.0 の XML 文字列を生成する（12_SITE_METADATA.md 4.5）。ファイルルートの component 内で呼ぶ。
//
//     export function rssFeed({ content }: PageProps<typeof content>) {
//         return rssXml({ items: content.posts.map((p) => ({ title: p.title, path: `/blog/${p.slug}`, date: p.date })) });
//     }
//
// lastBuildDate は items の date の最大値（現在時刻を使うとビルドが非決定的になるため使わない）。
// item の並び順は as-written（新しい順を推奨）。
export function rssXml(opt: RssOpt): string {
    const site = requireSite("rssXml()");

    // item の path は site の有無に関わらず検証する（違反は brokenLinks へ収集される）。
    for (const item of opt.items) {
        checkLink(item.path);
    }

    if (site === null) {
        // 違反は収集済み。dev は警告、build はまとめて報告して非ゼロ終了する。
        return "";
    }

    const title = opt.title ?? site.title;
    const description = opt.description ?? site.description;
    if (description === undefined) {
        reportMissingSiteConfig("rssXml() channel description (pass description to rssXml() or defineSite())");
    }
    const lang = opt.lang ?? site.lang;
    const lastBuild = opt.items.length > 0 ? new Date(Math.max(...opt.items.map((i) => i.date.getTime()))) : undefined;

    const channel: string[] = [
        `    <title>${escapeXml(title)}</title>`,
        `    <link>${escapeXml(`${site.origin}/`)}</link>`,
        `    <description>${escapeXml(description ?? "")}</description>`,
    ];
    if (lang !== undefined) channel.push(`    <language>${escapeXml(lang)}</language>`);
    if (lastBuild !== undefined) channel.push(`    <lastBuildDate>${escapeXml(lastBuild.toUTCString())}</lastBuildDate>`);

    const items = opt.items.flatMap((item) => {
        const url = site.origin + item.path;
        const lines = [
            `    <item>`,
            `      <title>${escapeXml(item.title)}</title>`,
            `      <link>${escapeXml(url)}</link>`,
            `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
            `      <pubDate>${escapeXml(item.date.toUTCString())}</pubDate>`,
        ];
        if (item.description !== undefined) {
            lines.push(`      <description>${escapeXml(item.description)}</description>`);
        }
        lines.push(`    </item>`);
        return lines;
    });

    return [`<?xml version="1.0" encoding="UTF-8"?>`, `<rss version="2.0">`, `  <channel>`, ...channel, ...items, `  </channel>`, `</rss>`, ``].join("\n");
}
