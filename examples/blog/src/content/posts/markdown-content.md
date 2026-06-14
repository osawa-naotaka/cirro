---
title: "Markdown と frontmatter でコンテンツを書く"
author: "hanako"
date: "2026-05-15"
tags: ["markdown", "content"]
description: "記事は Markdown、メタ情報は frontmatter。remark / rehype による HTML 変換の流れを紹介します。"
---

## frontmatter にメタ情報を書く

各記事は 1 つの Markdown ファイルです。ファイル先頭の **frontmatter**（YAML）に、
タイトル・著者・日付・タグといったメタ情報を記載します。

```md
---
title: "記事のタイトル"
author: "hanako"
date: "2026-05-15"
tags: ["markdown", "content"]
description: "一覧に出る短い要約。"
---

ここから本文（Markdown）。
```

タグは **任意個数** 指定でき、一覧ページやタグページの生成に使われます。

## 本文は素直な Markdown

本文は普通の Markdown です。見出し、リスト、リンク、コードブロック、引用、テーブルなど、
よく使う記法はそのまま書けます。

- 箇条書き
- **強調** や *斜体*
- `インラインコード`
- [リンク](/about)

GFM 拡張も有効なので、テーブルや打ち消し線（~~こうした表現~~）も使えます。

## 変換の流れ

このサイトでは、Markdown を次のパイプラインで HTML に変換しています。

1. `remark-parse` で Markdown を解析
2. `remark-gfm` で GFM 拡張を有効化
3. `remark-rehype` で HTML 構造（hast）へ変換
4. `rehype-slug` で見出しに id を付与
5. `rehype-stringify` で HTML 文字列へ

変換は**ビルド時にサイト側**で実行され、結果は静的な HTML としてページに埋め込まれます。
読者のブラウザで Markdown を解釈する必要はありません。

> なお、この変換は現時点ではサイト側で行っています。Cirro 本体が安全な Markdown 描画 API を
> 提供するのは、これからの予定です。
