# @cirro-examples/blog

Panda CSS を使ったブログサイトの Cirro サンプル。記事は Markdown（frontmatter にメタ情報）で書き、
remark / rehype でビルド時に HTML 化して配信する。

スタイルはすべて Panda CSS がビルド時に生成する外部 CSS（`/styles.css`）で配信し、インライン
`<style>` も `style=""` 属性も一切生成しない。これにより `script-src 'self'` に加えて
`style-src 'self'` も満たす厳格な CSP で動作する。

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
- **スタイル**: Panda CSS（`panda.config.ts`）で色・角丸・フォントをトークン管理し、`css()` や
  レシピ（`button` / `chip`）で記述する。Panda は**ランタイム CSS-in-JS ではなく**、ビルド時に
  ソースを静的解析して `public/styles.css` を生成する。実行時の `css()` は事前計算済みのクラス名を
  返すだけで、`<style>` の注入は起きない。フォントは外部リクエストを避けるためシステムフォント
  スタックを使う（`style-src 'self'` / `font-src 'self'`）。
- **島**: 「ページ上部へ戻る」ボタンのみが島。スタイルは Panda のクラスで与え、表示/非表示も
  静的クラスの差し替えで行うため、クライアントで再レンダリングされてもインラインスタイルを
  注入しない。
- **CSP**: 生成される全ページにインラインスクリプトもインラインスタイルも含まれない
  （`script-src 'self'` かつ `style-src 'self'` で動作）。

## 開発

```sh
bun install        # 初回。postinstall(prepare) で panda codegen が走り styled-system/ を生成
bun run dev        # 開発サーバー（HMR）+ panda cssgen --watch を並行実行
bun run build      # styles.css 生成 → 型チェック → 静的サイトを dist/ に生成
bun run preview    # ビルド結果をプレビュー
bun run typecheck  # 型チェック
```

> メモ: `bun run dev` は `concurrently` で `panda cssgen --watch`（`public/styles.css` を再生成）と
> `cirro dev` を同時に起動する。コンポーネント（`.tsx`）を保存すると Cirro が full-reload するので、
> その際に最新の `styles.css` が読み込まれる。`styled-system/` と `public/styles.css` は生成物のため
> Git 管理対象外（`.gitignore`）。
