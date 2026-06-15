---
title: "Cirro をはじめよう — セキュリティ第一の軽量 SSG"
author: "lulliecat"
date: "2026-06-10"
tags: ["cirro", "ssg", "csp"]
description: "Cirro が何を解決する SSG なのか、その出発点と基本的な考え方を紹介します。"
---

## Cirro とは

**Cirro** は、React の島（islands）アーキテクチャによって、`unsafe-inline` 不要の
厳格な Content Security Policy（CSP）を実現する軽量な静的サイトジェネレーターです。

出発点はとてもシンプルで、次のような不満からはじまりました。

> 既存のツールはスクリプトの大半を外部ファイルに分離できても、ごくわずかにインライン
> スクリプトが残ってしまう。そのため CSP で `unsafe-inline` を許可せざるを得ない。

Cirro は、このわずかなインラインスクリプトを **完全にゼロ** にし、`script-src 'self'`
だけで成立する静的サイトを生成します。

## 3 つの柱

1. **インラインスクリプトゼロ** — 生成物に一切のインラインスクリプトを含めない
2. **島アーキテクチャ** — 本文は静的 HTML、動く部分だけをクライアントでハイドレート
3. **React だけ** — 独自テンプレート構文を学ばず、React の知識でサイトを書ける

## 最小の例

ページはただの React コンポーネントです。

```tsx
export function HomePage() {
    return (
        <html lang="ja">
            <head>
                <title>はじめての Cirro</title>
            </head>
            <body>
                <h1>Hello, Cirro!</h1>
            </body>
        </html>
    );
}
```

これがビルド時に **純粋な静的 HTML** へ変換されます。島を 1 つも置かなければ、この
ページはクライアントへ JavaScript を一切送りません。

次の記事では、その仕組みである「島アーキテクチャ」を詳しく見ていきます。
