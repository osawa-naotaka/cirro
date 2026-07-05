
import { createIndex, indexToObject, LinearIndex, StaticSeekError } from "staticseek";
import { markdownToText } from "cirrojs/server";
import type { PageProps } from "cirrojs";
import type { content } from "../content";

export function generateSearchIndex(props: PageProps<typeof content>): string {
    const target = props.content.posts.map((md) => {
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
