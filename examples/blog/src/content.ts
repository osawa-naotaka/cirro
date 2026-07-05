import { defineContent } from "cirrojs"
import matter from "gray-matter";
import type { Post } from "./lib/types";

export const content = defineContent({
    loader: async () => {
        const files = import.meta.glob("./content/posts/*.md", {
            query: "?raw",
            import: "default",
            eager: true,
        }) as Record<string, string>;
      
        // ファイルパスから slug（拡張子なしのファイル名）を取り出す。
        function slugFromPath(path: string): string {
            const name = path.split("/").pop() ?? "";
            return name.replace(/\.md$/, "");
        }
      
        // 全記事。frontmatter をパースし本文 Markdown を保持したうえで、日付の新しい順に並べる。
        const posts: Post[] = Object.entries(files)
            .map(([path, raw]) => {
                const { data, content } = matter(raw);
                return {
                    slug: slugFromPath(path),
                    title: String(data.title ?? "(無題)"),
                    author: String(data.author ?? ""),
                    date: String(data.date ?? ""),
                    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
                    description: String(data.description ?? ""),
                    content,
                } satisfies Post;
            })
            .sort((a, b) => b.date.localeCompare(a.date));

        return { posts };
    },
});
