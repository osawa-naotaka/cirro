// サイトメタデータの宣言（12_SITE_METADATA.md 4.1）。
// origin の検証はコンテンツ起因ではなく設定ミスなので、収集レールに乗せず宣言時に即 throw する。

export type SiteConfig = {
    // スキーム + ホスト（+ ポート）のみ。パス・末尾スラッシュ・クエリ・フラグメント不可。
    origin: string;
    // RSS channel title / og:site_name に使う。
    title: string;
    // RSS channel description / og:description の既定。
    description?: string;
    // RSS <language> に使う（例 "ja"）。
    lang?: string;
};

export type Site = Readonly<SiteConfig>;

export function defineSite(config: SiteConfig): Site {
    const { origin, title } = config;

    let parsed: URL;
    try {
        parsed = new URL(origin);
    } catch {
        throw new Error(`cirro: defineSite() origin is not a valid URL: "${origin}"`);
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new Error(`cirro: defineSite() origin must use the https (or http) scheme: "${origin}"`);
    }
    // `input === new URL(input).origin` の 1 条件で、末尾スラッシュ・パス・クエリ・
    // フラグメント・大文字ホスト等がすべて弾ける（サブパス配下のデプロイは非対応）。
    if (origin !== parsed.origin) {
        throw new Error(
            `cirro: defineSite() origin must be scheme + host (+ port) only: "${origin}" (expected "${parsed.origin}"). ` +
                "Paths, trailing slashes, queries, and fragments are not allowed; subpath deployments are not supported.",
        );
    }
    if (typeof title !== "string" || title === "") {
        throw new Error("cirro: defineSite() requires a non-empty title");
    }

    return Object.freeze({ ...config });
}
