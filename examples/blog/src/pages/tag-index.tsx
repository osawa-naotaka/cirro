import { Box, Chip, Typography } from "@mui/material";
import { Layout } from "../components/Layout";
import { allTags } from "../lib/content";

// タグインデックス: 全タグを記事数つきで一覧表示。島なし＝JS ゼロのページ。
export function TagIndexPage() {
    const tags = allTags();

    return (
        <Layout title="タグ一覧 — Cirro Blog" description="Cirro Blog の全タグ一覧。" island={false}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                タグ一覧
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                全 {tags.length} 個のタグ
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                {tags.map(({ tag, count }) => (
                    <Chip
                        key={tag}
                        label={`${tag} (${count})`}
                        component="a"
                        href={`/tags/${tag}`}
                        clickable
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: "0.95rem", py: 2 }}
                    />
                ))}
            </Box>
        </Layout>
    );
}
