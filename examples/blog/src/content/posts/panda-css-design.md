---
title: "Panda CSS で厳格 CSP のままデザインを統一する"
author: "taro"
date: "2026-05-08"
tags: ["design", "panda", "css"]
description: "ビルド時に静的 CSS を生成する Panda CSS を、Cirro の static サイトに組み込むコツ。"
---

## なぜ Panda CSS なのか

このブログのデザインには **Panda CSS** を採用しています。理由はシンプルで、
TypeScript の関数（`css()` やレシピ）で型安全にスタイルを書きつつ、**ビルド時に
すべて外部 CSS ファイルへ抽出**できるからです。

```tsx
import { css } from "../../styled-system/css";

export function PostCard({ title }: { title: string }) {
    return (
        <article className={css({ border: "1px solid token(colors.border)", borderRadius: "card", p: "4" })}>
            <h2 className={css({ fontSize: "lg", fontWeight: 700 })}>{title}</h2>
        </article>
    );
}
```

## ランタイム CSS-in-JS との違い

見た目は CSS-in-JS に似ていますが、実行モデルが根本的に違います。Emotion などの
ランタイム CSS-in-JS は**実行時に `<style>` タグを注入**するため、CSP で
`style-src 'self'` を厳格にすると動きません。

Panda は**ビルド時にソースを静的解析**し、使われた `css()` 呼び出しを 1 枚の
`styles.css` へ集約します。実行時の `css()` は事前計算済みのクラス名を返すだけで、
スタイルの計算も注入も起きません。だから Cirro の厳格な CSP と両立します。

- すべてのスタイルは外部 `.css`（`<link rel="stylesheet">` 経由）
- インライン `<style>` も `style=""` 属性も生成しない
- トークン・レシピで色・角丸・タイポグラフィを一元管理

## 動かしたい部分は「島」に

ボタンのクリックやスクロール連動など、**実際に動く UI** は島として切り出します。
このサイトでは「ページ上部へ戻る」ボタンが島になっており、その部分だけがクライアントで
ハイドレートされます。島のスタイルも Panda のクラスなので、再レンダリングしても
インラインスタイルは一切注入されません。

| 部分 | 配信方法 |
| --- | --- |
| ヘッダー・カード・本文 | 静的 HTML（JS なし） |
| 上部へ戻るボタン | 島（外部 JS でハイドレート） |

見た目は Panda で型安全に、配信は Cirro で軽量に、そしてセキュリティは
`style-src 'self'` のまま。この組み合わせがおすすめです。
