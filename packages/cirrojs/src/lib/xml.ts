// sitemap / RSS の生成で共有する XML エスケープ（内部ユーティリティ・非公開）。
export function escapeXml(s: string): string {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
