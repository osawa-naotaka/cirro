import { basename, dirname, extname, join } from "node:path";

export function collectLinks(paths: string[], initialLinks?: Set<string>): Set<string> {
    const links = initialLinks ?? new Set<string>();
    for (const p of paths) {
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
    }

    return links;
}
