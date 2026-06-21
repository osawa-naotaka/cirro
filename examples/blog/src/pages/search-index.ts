
import { createIndex, indexToObject, LinearIndex, StaticSeekError } from "staticseek";
import { markdownToText } from "cirrojs/server";
import { posts } from "../lib/content";

export function genearteSearchIndex(): string {
    const target = posts.map((md) => {
        const content = markdownToText(md.content);
        return {
            ...md,
            content
        };
    });

    const index = createIndex(LinearIndex, target, {
        key_fields: ["slug", "title", "date", "tags"],
        search_targets: ["title", "description", "content"]
    })

    if (index instanceof StaticSeekError) throw index;
    return JSON.stringify(indexToObject(index));
}
