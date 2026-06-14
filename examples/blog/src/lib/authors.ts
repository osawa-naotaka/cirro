import type { Author } from "./types";

// 著者の一覧。記事の frontmatter の `author` はここの id を参照する。
export const authors: Author[] = [
    {
        id: "lulliecat",
        name: "大河るり",
        role: "Cirro 開発者",
        bio: "セキュリティを第一に考える静的サイトジェネレーター Cirro を開発しています。CSP 厳格化と軽量な配信に関心があります。",
    },
    {
        id: "hanako",
        name: "山田 花子",
        role: "テクニカルライター",
        bio: "Markdown ベースのコンテンツ運用と、書きやすさ・読みやすさの両立について発信しています。",
    },
    {
        id: "taro",
        name: "鈴木 太郎",
        role: "フロントエンドエンジニア",
        bio: "React と Material UI を使った UI 設計が得意です。アクセシビリティとデザインシステムに興味があります。",
    },
];

const byId = new Map(authors.map((a) => [a.id, a]));

// id から著者を取得する（未登録 id でも一覧表示が壊れないようフォールバックを返す）。
export function getAuthor(id: string): Author {
    return byId.get(id) ?? { id, name: id, role: "寄稿者", bio: "" };
}
