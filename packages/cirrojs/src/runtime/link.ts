import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path/posix";
import type { ResolvedPath } from "./router";

// 出力 path のクリーン URL 正規形（09_LINK_SAFETY.md 4.4 の表のクリーン URL 側）。
// collectLinks が登録する複数綴りのうちの正規の 1 つで、pageUrl() / og:url / sitemap が使う。
// - /index.html → /
// - /path/to/index.html → /path/to/
// - /path/about.html → /path/about
// - それ以外（ファイルルート等）はそのまま
export function cleanUrlPath(path: string): string {
    if (path.endsWith("/index.html") || path.endsWith("/index.htm")) {
        const dir = dirname(path);
        return dir === "/" ? "/" : `${dir}/`;
    }
    const ext = extname(path);
    if (ext === ".html" || ext === ".htm") {
        return join(dirname(path), basename(path, ext));
    }
    return path;
}

export function collectLinks(paths: string[], initialLinks?: Set<string>): Set<string> {
    const links = initialLinks ?? new Set<string>();
    for (const p of paths) {
        try {
            links.add(decodeURIComponent(p));

            if (p.endsWith("/index.html") || p.endsWith("/index.htm")) {
                const dir = dirname(p);
                links.add(decodeURIComponent(dir));
                if (dir !== "/") {
                    links.add(decodeURIComponent(`${dir}/`));
                }
            } else {
                const ext = extname(p);
                if (ext === ".html" || ext === ".htm") {
                    const dir = dirname(p);
                    links.add(decodeURIComponent(join(dir, basename(p, ext))));
                }
            }
        } catch (e) {
            if (e instanceof URIError) {
                console.warn(`Invalid URI: ${p}`, e);
            } else {
                throw e;
            }
        }
    }

    return links;
}

export function collectSiteLinks(pages: ResolvedPath[], publicPath: false | string): Set<string> {
    let links = collectLinks(pages.map((p) => p.path));
    if (publicPath !== false && publicPath !== "") {
        if (existsSync(publicPath)) {
            const publicFiles = readdirSync(publicPath, { recursive: true, withFileTypes: true });
            links = collectLinks(
                publicFiles.filter((x) => x.isFile()).map((x) => join(x.parentPath.replaceAll("\\", "/"), x.name).replace(publicPath, "")),
                links,
            );
        }
    }
    return links;
}
