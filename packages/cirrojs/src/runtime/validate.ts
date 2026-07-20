import { extname } from "node:path/posix";
import { collectLinks } from "./link.ts";
import type { ResolvedPath } from "./router.ts";

// ルート展開後の検査（14_CONFIG_VALIDATION.md 4.2）。コンテンツに依存して初めて確定する違反
// （slug 重複等）なので、throw せず全件収集して build は一括報告 + 非ゼロ終了、dev は警告とする。
export type RouteError = {
    type: "malformed-path" | "duplicate-path" | "public-collision";
    path: string;
    detail: string;
};

// 検査対象は利用者由来のルート（html / file）のみ。css / fontawesome の合成ルートは内部生成のため対象外。
export function validateRoutes(pages: ResolvedPath[], publicFiles: string[]): RouteError[] {
    const errors: RouteError[] = [];
    const userPages = pages.filter((p) => p.type === "html" || p.type === "file");

    // S4: パス形式。リンク照合（09_LINK_SAFETY.md 4.4）は「path は html ファイルの exact な名前」を
    // 前提とするため、前提違反は照合の偽陰性・偽陽性として遠くで壊れる。ここで止める。
    for (const page of userPages) {
        const detail = checkPathFormat(page.path, page.type);
        if (detail !== null) {
            errors.push({ type: "malformed-path", path: page.path, detail });
        }
    }

    // S2: 出力パスの重複。build は後勝ちで上書き・dev は先勝ちになり、silent なうえ
    // dev / build で表示が食い違う。動的ルートの slug 重複が典型。
    const seen = new Map<string, number>();
    for (const page of userPages) {
        seen.set(page.path, (seen.get(page.path) ?? 0) + 1);
    }
    for (const [path, count] of seen) {
        if (count > 1) {
            errors.push({
                type: "duplicate-path",
                path,
                detail: `${count} routes emit the same output path (check duplicate slugs in getStaticPaths and duplicate static routes)`,
            });
        }
    }

    // S3: public/ とルートの衝突。dev と build で勝者が異なりうるため、配信可能な綴り
    // （クリーン URL 含む）同士の交差をすべて違反とする。
    const routeSpellings = collectLinks(userPages.map((p) => p.path));
    const publicSpellings = collectLinks(publicFiles);
    for (const spelling of routeSpellings) {
        if (publicSpellings.has(spelling)) {
            errors.push({
                type: "public-collision",
                path: spelling,
                detail: "a route output and a public/ file are served at the same URL (dev and build may pick different winners)",
            });
        }
    }

    return errors;
}

// 違反があれば null 以外（理由）を返す。
function checkPathFormat(path: string, kind: "html" | "file"): string | null {
    if (!path.startsWith("/")) return 'output path must start with "/"';
    if (path.startsWith("//")) return 'output path must not start with "//"';
    if (path.includes("\\")) return "output path must not contain backslashes";
    if (path.includes("?") || path.includes("#")) return 'output path must not contain "?" or "#" (it is a file path, not a URL)';
    // biome-ignore lint/suspicious/noControlCharactersInRegex: 制御文字を含む出力パスを意図的に拒否している
    if (/[\u0000-\u001f\u007f]/.test(path)) return "output path must not contain control characters";
    const segments = path.split("/").slice(1);
    if (segments.some((s) => s === "" || s === "." || s === "..")) {
        return 'output path must not contain empty, "." or ".." segments';
    }
    if (kind === "html") {
        const ext = extname(path);
        if (ext !== ".html" && ext !== ".htm") {
            return 'static / dynamic route paths must be the exact html file name ending with ".html" or ".htm" (link checking depends on it)';
        }
    } else {
        if (extname(path) === "") {
            return "file route paths must include a file extension";
        }
    }
    return null;
}

export function reportRouteErrors(errors: RouteError[]): void {
    for (const e of errors) {
        console.warn(`Route error (${e.type}) at "${e.path}": ${e.detail}`);
    }
}
