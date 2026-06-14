import { Box } from "@mui/material";

// remark/rehype で生成した本文 HTML を描画するコンテナ。
//
// 注意: ここで dangerouslySetInnerHTML を使っている。本文の Markdown はサイト所有者が
// 管理する信頼できるコンテンツであり、remark-rehype は既定で raw HTML を通さない（コンテンツを
// 実行可能にしない）ため、現時点では許容している。将来 cirro 本体が安全な Markdown 描画 API を
// 提供したら、この dangerouslySetInnerHTML は置き換える予定。
//
// 見た目は sx の子孫セレクタで Material UI のテーマに馴染ませる（typography プラグインは使わず軽量に）。
export function ArticleBody({ html }: { html: string }) {
    return (
        <Box
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 信頼できる自前コンテンツ。cirro 側 API 提供までの暫定。
            dangerouslySetInnerHTML={{ __html: html }}
            sx={{
                color: "text.primary",
                fontSize: "1.05rem",
                lineHeight: 1.9,
                wordBreak: "break-word",
                "& h2": { mt: 5, mb: 2, fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.4 },
                "& h3": { mt: 4, mb: 1.5, fontSize: "1.3rem", fontWeight: 700 },
                "& p": { my: 2 },
                "& a": { color: "primary.main", textDecoration: "underline" },
                "& ul, & ol": { pl: 3, my: 2 },
                "& li": { my: 0.5 },
                "& blockquote": {
                    borderLeft: 4,
                    borderColor: "primary.light",
                    bgcolor: "action.hover",
                    m: 0,
                    my: 3,
                    px: 2.5,
                    py: 1,
                    color: "text.secondary",
                },
                "& code": {
                    bgcolor: "action.hover",
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: "0.9em",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                },
                "& pre": {
                    bgcolor: "#0f172a",
                    color: "#e2e8f0",
                    p: 2.5,
                    borderRadius: 2,
                    overflowX: "auto",
                    my: 3,
                },
                "& pre code": { bgcolor: "transparent", p: 0, color: "inherit", fontSize: "0.9rem" },
                "& table": { borderCollapse: "collapse", width: "100%", my: 3 },
                "& th, & td": { border: 1, borderColor: "divider", px: 1.5, py: 1, textAlign: "left" },
                "& th": { bgcolor: "action.hover", fontWeight: 700 },
                "& img": { maxWidth: "100%", height: "auto", borderRadius: 2 },
                "& hr": { border: 0, borderTop: 1, borderColor: "divider", my: 4 },
            }}
        />
    );
}
