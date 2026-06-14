---
title: "なぜ厳格な CSP にこだわるのか"
author: "lulliecat"
date: "2026-05-22"
tags: ["csp", "security"]
description: "unsafe-inline を排除した script-src 'self' が、サイトのセキュリティにとってなぜ重要なのか。"
---

## CSP のおさらい

Content Security Policy（CSP）は、ブラウザが読み込んでよいリソースを制限する仕組みです。
特にスクリプトについては、`script-src` ディレクティブで「どこから来た JS を実行してよいか」を
指定します。

```
Content-Security-Policy: script-src 'self'
```

これは「自分のオリジンから配信された外部スクリプトだけを許可する」という意味です。

## `unsafe-inline` の問題

HTML に直接書かれたインラインスクリプトを動かすには、`'unsafe-inline'` を許可する必要があります。

```
Content-Security-Policy: script-src 'self' 'unsafe-inline'
```

しかし `'unsafe-inline'` を許可すると、**XSS で注入されたスクリプトも実行されてしまう**ため、
CSP の防御効果が大きく損なわれます。たった 1 行のインラインスクリプトのために、サイト全体の
スクリプト防御を緩めることになるのです。

## Cirro のアプローチ

Cirro は、生成物に **インラインスクリプトを一切含めない**ことで、この妥協を不要にします。

- 島の props は `data-*` 属性で渡す（インラインスクリプト不要）
- スクリプトはすべて `<script src>` で外部ファイルとして読み込む
- ビルド出力のローダー類もインライン化しない

結果として、次の最小限の CSP で動作します。

```
Content-Security-Policy: script-src 'self'
```

`'unsafe-inline'` も `'unsafe-eval'` も要りません。これが Cirro の存在意義であり、
最大の差別化点です。

> セキュリティは「あとから足す」ものではなく、最初から「当然満たせる」状態にしておきたい。
> Cirro はその考えから生まれました。
