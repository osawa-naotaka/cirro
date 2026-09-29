// sitemap / RSS の生成で共有する XML エスケープ（内部ユーティリティ・非公開）。
export function escapeXml(s: string): string {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function join(...parts: (string | undefined)[]): string {
    let path = "";
    for (const part of parts) {
        if (part === undefined) continue;

        if (path === "") {
            path = part;
        } else if (path.endsWith("/")) {
            if (part.startsWith("/")) {
                path += part.slice(1);
            } else {
                path += part;
            }
        } else {
            if (part.startsWith("/")) {
                path += part;
            } else {
                path += `/${part}`;
            }
        }
    }
    return path;
}
