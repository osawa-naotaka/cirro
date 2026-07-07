import { basename, dirname, extname, join } from "node:path";
import type { ResolvedPath } from "../router";

export function collectLinks(paths: ResolvedPath[]): Set<string> {
    const links = new Set<string>();
    for (const p of paths) {
        links.add(decodeURIComponent(p.path));

        if (p.path.endsWith("/index.html") || p.path.endsWith("/index.htm")) {
            const dir = dirname(p.path);
            links.add(decodeURIComponent(dir));
            if (dir !== "/") {
                links.add(decodeURIComponent(`${dir}/`));
            }
        } else {
            const ext = extname(p.path);
            if (ext === ".html" || ext === ".htm") {
                const dir = dirname(p.path);
                links.add(decodeURIComponent(join(dir, basename(p.path, ext))));
            }
        }
    }

    return links;
}
