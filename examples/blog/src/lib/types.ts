// ブログのドメイン型定義。

// Markdown frontmatter に記載するメタ情報。
export type PostFrontmatter = {
    title: string;
    author: string; // Author.id への参照
    date: string; // ISO 形式の日付文字列（例: "2026-05-01"）
    tags: string[]; // 任意個数のタグ
    description: string; // 一覧やメタタグで使う要約
};

// frontmatter に本文 HTML と slug を加えた、ページ描画に使う記事データ。
export type Post = PostFrontmatter & {
    slug: string;
    html: string; // remark/rehype で変換済みの本文 HTML
};

// タグ一覧用の集計エントリ。
export type TagCount = {
    tag: string;
    count: number;
};

// 著者プロフィール。
export type Author = {
    id: string;
    name: string;
    role: string;
    bio: string;
};
