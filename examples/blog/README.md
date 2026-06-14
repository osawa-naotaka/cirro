# @cirro-examples/blog

Material UI を使ったブログサイトの Cirro サンプル。記事は Markdown（frontmatter にメタ情報）で書き、
remark / rehype でビルド時に HTML 化して配信する。

## ページ構成

| URL | 内容 |
| --- | --- |
| `/` | ホーム（ヒーロー・最新記事・タグ） |
| `/blog` | ブログインデックス（全記事一覧） |
| `/blog/[slug]` | ブログ個別記事 |
| `/tags` | タグインデックス（全タグ一覧） |
| `/tags/[tag]` | タグ別記事一覧 |
| `/authors/[id]` | 著者ページ（プロフィール＋執筆記事） |
| `/about` | About ページ |

## コンテンツの書き方

`src/content/posts/*.md` に Markdown を追加するだけで記事が増える。frontmatter にメタ情報を記載する。

```md
---
title: "記事のタイトル"
author: "naotaka"        # src/lib/authors.ts の id を参照
date: "2026-06-10"        # 表示・並び替えに使用
tags: ["cirro", "ssg"]   # 任意個数
description: "一覧に出る要約。"
---

ここから本文（Markdown）。
```

著者は `src/lib/authors.ts` で定義する。

## 仕組みのポイント

- **Markdown → HTML はサイト側で変換**: `src/lib/markdown.ts` の unified パイプライン
  （remark-parse → remark-gfm → remark-rehype → rehype-slug → rehype-stringify）を
  `processSync` で同期実行する。cirro 本体はまだ Markdown 描画 API を提供していないため、
  利用者が自前で組んでいる。
- **本文の埋め込み**: 変換結果は `src/components/ArticleBody.tsx` で `dangerouslySetInnerHTML`
  により描画する。raw HTML は remark-rehype が既定で通さないため、信頼できる自前コンテンツに限り
  許容している（cirro 側 API 提供までの暫定）。
- **島**: 「ページ上部へ戻る」ボタンのみが島。Material UI（emotion）を使わずプレーンな React で実装し、
  島の描画と外側ページの描画でスタイル収集が二重にならないようにしている。
- **CSP**: 生成される全ページにインラインスクリプトは含まれない（`script-src 'self'` で動作）。

## 開発

```sh
bun run dev        # 開発サーバー（HMR）
bun run build      # 静的サイトを dist/ に生成
bun run preview    # ビルド結果をプレビュー
bun run typecheck  # 型チェック
```
