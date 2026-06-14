---
title: "Material UI で静的サイトに一貫したデザインを"
author: "taro"
date: "2026-05-08"
tags: ["design", "mui", "react"]
description: "サーバーレンダリングと相性のよい Material UI を、Cirro の静的サイトに組み込むコツ。"
---

## なぜ Material UI なのか

このブログのデザインには **Material UI（MUI）** を採用しています。理由はシンプルで、
React コンポーネントとして UI を組み立てられ、テーマで見た目を一元管理できるからです。

```tsx
import { Card, CardContent, Typography } from "@mui/material";

export function PostCard({ title }: { title: string }) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6">{title}</Typography>
            </CardContent>
        </Card>
    );
}
```

## 静的レンダリングとの相性

Cirro はページをビルド時にサーバーで描画します。MUI（と emotion）はサーバー
レンダリングに対応しているため、スタイルを含んだ HTML がそのまま生成されます。

- テーマで色・タイポグラフィ・角丸などを統一
- `sx` プロップでコンポーネント単位の微調整
- レイアウトは `Container` / `Stack` / `Box` で宣言的に

## 動かしたい部分は「島」に

ボタンのクリックやスクロール連動など、**実際に動く UI** は島として切り出します。
このサイトでは「ページ上部へ戻る」ボタンが島になっており、その部分だけがクライアントで
ハイドレートされます。

静的に見せられるところは静的に、動かすところだけ島に。デザインの一貫性を保ちながら、
配信する JavaScript を最小限にできます。

| 部分 | 配信方法 |
| --- | --- |
| ヘッダー・カード・本文 | 静的 HTML（JS なし） |
| 上部へ戻るボタン | 島（外部 JS でハイドレート） |

見た目は MUI でリッチに、配信は Cirro で軽量に。この組み合わせがおすすめです。
