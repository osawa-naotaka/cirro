import { checkImage, currentPagePath, requireSite } from "cirrojs/registry";
import type { ReactNode } from "react";

export type OgpProps = {
    // og:title
    title: string;
    // og:type（既定 "website"）
    type?: "website" | "article";
    // og:description。省略時は site.description（それも無ければ出力しない）
    description?: string;
    // og:image。ルート相対パス。public 配下との照合で存在検証される
    image?: string;
    // twitter:card。指定時のみ出力
    twitterCard?: "summary" | "summary_large_image";
};

// OGP メタタグ一式を出力するコンポーネント（12_SITE_METADATA.md 4.6）。SSR 専用（島内では使わない）。
// React 19 のメタデータ巻き上げにより、ツリーのどこに置いても <meta> は <head> へ巻き上げられる。
// og:url は「今どのページを描画しているか」から自動で決まるため、利用者はページごとの URL を書かない。
export function Ogp({ title, type = "website", description, image, twitterCard }: OgpProps): ReactNode {
    const site = requireSite("<Ogp>");
    if (site === null) {
        // 違反は収集済み。dev は警告、build はまとめて報告して非ゼロ終了する。
        return null;
    }

    const url = site.origin + (currentPagePath() ?? "");
    const desc = description ?? site.description;
    // og:image は Image と同じレールで検証する（存在しなければ brokenImageSrc に収集され出力しない）。
    const imageSrc = image !== undefined ? checkImage(image) : null;

    return (
        <>
            <meta property="og:title" content={title} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content={site.title} />
            {desc !== undefined ? <meta property="og:description" content={desc} /> : null}
            {imageSrc !== null ? <meta property="og:image" content={site.origin + imageSrc} /> : null}
            {twitterCard !== undefined ? <meta name="twitter:card" content={twitterCard} /> : null}
        </>
    );
}
