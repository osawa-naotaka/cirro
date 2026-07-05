import type { Post, TagCount } from "./types";

// slug から記事を取得する。
export function getPost(slug: string, posts: Post[]): Post | undefined {
    return posts.find((p) => p.slug === slug);
}

// 全タグと記事数を、出現数の多い順（同数なら名前順）で集計する。
export function allTags(posts: Post[]): TagCount[] {
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
export function postsByTag(tag: string, posts: Post[]): Post[] {
    return posts.filter((p) => p.tags.includes(tag));
}

// 指定著者の記事一覧。
export function postsByAuthor(authorId: string, posts: Post[]): Post[] {
    return posts.filter((p) => p.author === authorId);
}
