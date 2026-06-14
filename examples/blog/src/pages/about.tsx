import { Box, Divider, List, ListItem, ListItemText, Typography } from "@mui/material";
import { Layout } from "../components/Layout";

const FEATURES = [
    {
        title: "インラインスクリプトゼロ / 厳格 CSP",
        body: "生成される全ページがインラインスクリプトを含まず、script-src 'self' だけの CSP で動作します。",
    },
    {
        title: "島（islands）アーキテクチャ",
        body: "本文は静的 HTML として配信し、インタラクティブな部分だけを「島」としてクライアントでハイドレートします。",
    },
    {
        title: "React だけで書ける",
        body: "独自テンプレート構文を学ぶ必要はありません。普段の React の知識でサイトを構築できます。",
    },
    {
        title: "軽量な配信",
        body: "本文（静的部分）にはコードもランタイムも乗りません。動かしたい「島」の分だけ JavaScript を配信します。",
    },
];

// About ページ。島を含まない純粋な静的ページ（island={false} で JS ゼロ）。
export function AboutPage() {
    return (
        <Layout
            title="About — Cirro Blog"
            description="このサイトはセキュリティ第一の軽量 SSG「Cirro」で構築されています。"
            island={false}
        >
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
                このサイトについて
            </Typography>
            <Typography sx={{ mb: 2, lineHeight: 1.9 }}>
                Cirro Blog は、セキュリティを第一に考えた軽量な静的サイトジェネレーター「Cirro」の
                公式サンプルブログです。デザインには Material UI を採用し、記事は Markdown
                （frontmatter にタイトル・著者・日付・タグを記載）で執筆しています。
            </Typography>
            <Typography sx={{ mb: 4, lineHeight: 1.9 }}>
                Markdown は remark / rehype でビルド時に HTML へ変換され、静的なページとして
                配信されます。クライアントへ送られる JavaScript は「島」の分だけで、すべて外部
                ファイルとして読み込まれます。
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                Cirro の特徴
            </Typography>
            <List>
                {FEATURES.map((f) => (
                    <ListItem key={f.title} alignItems="flex-start" disableGutters>
                        <ListItemText
                            primary={f.title}
                            secondary={f.body}
                            primaryTypographyProps={{ fontWeight: 700, gutterBottom: true }}
                        />
                    </ListItem>
                ))}
            </List>

            <Box sx={{ mt: 4, p: 3, bgcolor: "action.hover", borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    このページは「島」を 1 つも含まない純粋な静的ページです。本文の表示に
                    JavaScript は必要なく、ハイドレーションも発生しません。Cirro が目指すのは、
                    こうしたページを JS ゼロで配信することです（島の有無に応じた配信の最適化は今後の課題です）。
                </Typography>
            </Box>
        </Layout>
    );
}
