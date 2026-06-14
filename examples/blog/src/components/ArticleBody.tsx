import { css } from "../../styled-system/css";

// remark/rehype で生成した本文 HTML を描画するコンテナ。
//
// 注意: ここで dangerouslySetInnerHTML を使っている。本文の Markdown はサイト所有者が
// 管理する信頼できるコンテンツであり、remark-rehype は既定で raw HTML を通さない（コンテンツを
// 実行可能にしない）ため、現時点では許容している。将来 cirro 本体が安全な Markdown 描画 API を
// 提供したら、この dangerouslySetInnerHTML は置き換える予定。
//
// 見た目は css() の子孫セレクタで整える。スタイルはビルド時に外部 CSS へ抽出される（style-src 'self'）。
const article = css({
    color: "fg",
    fontSize: "1.05rem",
    lineHeight: 1.9,
    wordBreak: "break-word",
    "& h2": { mt: "10", mb: "4", fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.4 },
    "& h3": { mt: "8", mb: "3", fontSize: "1.3rem", fontWeight: 700 },
    "& p": { my: "4" },
    "& a": { color: "primary", textDecoration: "underline" },
    "& ul, & ol": { pl: "6", my: "4" },
    "& li": { my: "1" },
    "& blockquote": {
        borderLeft: "4px solid token(colors.primary.light)",
        bg: "hover",
        m: "0",
        my: "6",
        px: "5",
        py: "2",
        color: "fg.muted",
    },
    "& code": {
        bg: "hover",
        px: "1.5",
        py: "0.5",
        borderRadius: "sm",
        fontSize: "0.9em",
        fontFamily: "mono",
    },
    "& pre": {
        bg: "#0f172a",
        color: "#e2e8f0",
        p: "5",
        borderRadius: "card",
        overflowX: "auto",
        my: "6",
    },
    "& pre code": { bg: "transparent", p: "0", color: "inherit", fontSize: "0.9rem" },
    "& table": { borderCollapse: "collapse", width: "100%", my: "6" },
    "& th, & td": { border: "1px solid token(colors.border)", px: "3", py: "2", textAlign: "left" },
    "& th": { bg: "hover", fontWeight: 700 },
    "& img": { maxW: "100%", h: "auto", borderRadius: "card" },
    "& hr": { border: "0", borderTop: "1px solid token(colors.border)", my: "8" },
});

export function ArticleBody({ html }: { html: string }) {
    return (
        <div
            className={article}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 信頼できる自前コンテンツ。cirro 側 API 提供までの暫定。
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
