import matter from "gray-matter";
import { markdownToHtml } from "./markdown";
import type { Post, TagCount } from "./types";

// content/posts 配下の Markdown を raw 文字列としてビルド時に読み込む。
// Vite の import.meta.glob（eager + ?raw）により、各ファイルの中身が文字列で得られる。
const files = import.meta.glob("../content/posts/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

// ファイルパスから slug（拡張子なしのファイル名）を取り出す。
function slugFromPath(path: string): string {
    const name = path.split("/").pop() ?? "";
    return name.replace(/\.md$/, "");
}

// 全記事。frontmatter をパースし本文を HTML 化したうえで、日付の新しい順に並べる。
export const posts: Post[] = Object.entries(files)
    .map(([path, raw]) => {
        const { data, content } = matter(raw);
        return {
            slug: slugFromPath(path),
            title: String(data.title ?? "(無題)"),
            author: String(data.author ?? ""),
            date: String(data.date ?? ""),
            tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
            description: String(data.description ?? ""),
            html: markdownToHtml(content),
        } satisfies Post;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

// slug から記事を取得する。
export function getPost(slug: string): Post | undefined {
    return posts.find((p) => p.slug === slug);
}

// 全タグと記事数を、出現数の多い順（同数なら名前順）で集計する。
export function allTags(): TagCount[] {
    const counts = new Map<string, number>();
    for (const post of posts) {
        for (const tag of post.tags) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
    }
    return [...counts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

// 指定タグを持つ記事一覧。
export function postsByTag(tag: string): Post[] {
    return posts.filter((p) => p.tags.includes(tag));
}

// 指定著者の記事一覧。
export function postsByAuthor(authorId: string): Post[] {
    return posts.filter((p) => p.author === authorId);
}
