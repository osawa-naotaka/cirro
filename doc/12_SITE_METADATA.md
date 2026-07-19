# サイトメタデータの設計 - defineSite / sitemap / RSS / OGP

本ドキュメントは、サイトメタデータ（`defineSite`）と、それを土台とする sitemap / RSS / OGP
ヘルパーの**設計判断とその理由**を記録するものである。`11_TODO.md` の課題 2 の設計にあたる。

**実装状況**: 6 章の 1〜6 すべて 2026-07 に実装済み。使い方は `04_USAGE.md` 5.7、実例は
`examples/blog`（`src/site.ts` / `src/pages/rss.ts` / `components/Layout.tsx` の `<Ogp>`）を参照。

関連実装: `packages/cirrojs/src/lib/site.ts`（defineSite）/ `lib/route.ts`（createRouteFn の
シグネチャ変更）/ `registry/registry.ts`（Store への site・現在ページ path の追加と
`absoluteUrl` / `pageUrl`）/ `lib/Ogp.tsx` / `lib/sitemap.ts` / `lib/rss.ts` /
`runtime/link.ts`（`cleanUrlPath`）/ `runtime/dev.ts`・`runtime/build.ts`。
テスト: `packages/cirrojs/test/site.test.ts`。

---

## 1. 問題設定

sitemap / RSS / OGP は、対象領域（ブログ・ポートフォリオ）では実質必須の機能である。
Cirro は `expandRoutes()` でビルド時に全 URL を知っているため、sitemap はほぼ自動で生成でき、
RSS はファイルルート + コンテンツ層の組み合わせで成立し、OGP は `<head>` の記述支援になる。

ただし 3 つの機能はすべて**絶対 URL** を必要とするのに対し、Cirro は現状サイトの
オリジン（`https://example.com`）を知らない。さらに整理すると、必要なのはオリジン単体ではなく
**サイトメタデータ一式**である。

| 消費者 | 必要な情報 |
| --- | --- |
| sitemap 生成（ランタイム） | オリジン（全 URL は `expandRoutes()` が既に持つ） |
| RSS ヘルパー（利用者のファイルルート内） | オリジン + チャンネルのタイトル・説明・言語 |
| OGP / canonical（利用者の JSX 内） | オリジン + サイト名 + 現在レンダリング中ページのパス |

消費者の半分は**利用者のコード（JSX / ファイルルート）**である。したがって「宣言した値に
利用者のコードから型付きで届くこと」が置き場所の要件になる。

## 2. 設計原則

> サイトメタデータは `defineSite()` で宣言し、`defineContent` と同じ二重チャネル
> （型は直接 import、ランタイムは `defineRoutes()` の戻り値への同梱）で配線する。
> レンダリング中は ALS の Store から「オリジン + 現在ページの path」を引けるようにし、
> sitemap / RSS / OGP はその上の薄いヘルパーとして提供する。

- `createRouteFn(content)` で確立した「**値を型の運び屋にする**」パターンの再利用であり、
  新しい概念を持ち込まない（`08_CONTENT_LAYER.md` 4.2）。
- ヘルパーが出力するサイト内 URL は、Link と同じ URL ストアで**ビルド時に存在検証する**。
  「SSG はビルド時に全てを知っている」（`09_LINK_SAFETY.md`）のレールに乗せる。
- 検証は opt-in、外部 URL は素の記述に逃がす、違反は throw せず Store へ収集して
  dev は警告 / build はまとめてエラー、という既存の契約をすべて踏襲する。

## 3. 検討して不採用にした案

### 3.1 `cirro()` プラグインオプションで宣言（不採用）

`cirro({ site: "https://example.com" })` のようにコンフィグの 1 フィールドとする案。
最も簡単だが、次の理由で不採用とした。

- 利用者の JSX から `vite.config.ts` は import できない。OGP や RSS に値を届けるには
  ランタイム経由の注入が別途必要になり、宣言場所と消費場所が分断される。
- サイトメタデータ（タイトル・説明等）まで含めるとコンフィグが肥大化し、宣言場所が
  routes 系（routes / content）とコンフィグの 2 系統に割れる。`08_CONTENT_LAYER.md` 3.3 で
  「コンフィグにパスを渡す配線」を退けたのと同じ問題構造である。

### 3.2 コンテンツ層（`defineContent` の loader）に混ぜる（不採用）

「出自の異なるデータが型付きで合流する場所」という定義には合うが、次の理由で不採用とした。

- コンテンツ層は opt-in（`examples/basic` は使っていない）なのに、sitemap は全サイトで
  欲しい機能である。依存関係が逆転する。
- ランタイムが「loader の戻り値のどのフィールドがオリジンか」を知る予約キー規約が必要になる。
- オリジンは静的な設定値であり、async な取得（loader）の対象ではない。

### 3.3 sitemap の全自動生成（不採用）

site が宣言されていれば `/sitemap.xml` を暗黙に出力する案。利用者が routes.ts に書いて
いないファイルが成果物に現れるのは「利用者に仕組みが見える薄さ」（`09_LINK_SAFETY.md` 3.2）に
反する。ファイルルートとして **1 行の明示宣言**（4.4）を要求する。宣言はルート定義に現れるため、
リンク照合の URL ストアにも自然に載る（`<Link to="/sitemap.xml">` が書ける）。

### 3.4 OGP 画像・RSS item に外部 URL を許す（不採用）

`og:image` や RSS item の `path` に `https://...` を許して素通しする案。Link が外部リンクを
素の `<a>` に、Image が外部画像を素の `<img>` に逃がしたのと同じ線引きを守り、ヘルパーは
**ルート相対パスのみ**受け付ける。「ヘルパーを通したものは検証済み」という contract を濁さない。
外部 URL を使いたい場合は素の `<meta>` を手書きする（OGP）。

### 3.5 サブパス配下のオリジン（初期フェーズでは除外）

GitHub Pages 型の `https://example.com/repo` 配下へのデプロイを許す案。ルート相対パスの
解釈・リンク照合・絶対 URL 化のすべてに base prefix が波及するため、初期フェーズでは
**ルート配信のみ**とする（第一目標の Cloudflare はルート配信）。`origin` の検証（4.1）で
パス付きを明確に拒否し、非対応であることをエラーメッセージで伝える。

### 3.6 Atom / JSON Feed（不採用・将来候補）

フィード形式は **RSS 2.0** のみとする。ブログ用途での互換性が最も広く、フィードリーダーは
事実上すべて対応している。Atom / JSON Feed は必要になったとき別ヘルパーとして追加できる。

## 4. 採用した設計

### 4.1 defineSite の API

```ts
// src/site.ts
import { defineSite } from "cirrojs";

export const site = defineSite({
    origin: "https://example.com", // 必須。スキーム + ホスト（+ ポート）のみ
    title: "サイトのタイトル",       // 必須。RSS channel title / og:site_name に使う
    description: "サイトの説明",     // 任意。RSS channel description / og:description の既定
    lang: "ja",                     // 任意。RSS <language> に使う
});
```

```ts
interface SiteConfig {
    origin: string;
    title: string;
    description?: string;
    lang?: string;
}

function defineSite(config: SiteConfig): Site; // 検証済みの読み取り専用オブジェクトを返す
```

- **origin の検証**: `input === new URL(input).origin` を要求する。この 1 条件で
  末尾スラッシュ・パス・クエリ・フラグメント・大文字ホスト等がすべて弾ける（3.5 参照）。
  スキームは `https:`（および開発用の `http:`）のみ許可する。違反は **defineSite の呼び出し時に
  即 throw** する。レンダリング中の違反収集（warn/error）レールに乗せないのは、これが
  コンテンツ起因ではなく設定ミスであり、正しい値なしにはヘルパーの出力すべてが壊れるためである。
- 戻り値はプレーンな読み取り専用オブジェクトで、`site.title` のように**直接 import して
  参照できる**（フッターへのサイト名表示等）。content と違い loader を持たない同期の値なので、
  `PageProps` のような注入機構は不要である。

### 4.2 配線: createRouteFn のオブジェクト形式（破壊的変更）

`createRouteFn` の引数を位置引数からオブジェクト形式に変更する。

```ts
// src/routes.ts
import { createRouteFn } from "cirrojs";
import { content } from "./content";
import { site } from "./site";

const { defineRoutes, route } = createRouteFn({ content, site });
// 引数なし・content のみ・site のみも可:
//   createRouteFn()
//   createRouteFn({ content })
//   createRouteFn({ site })
```

- **旧シグネチャ `createRouteFn(content)` は削除する**（破壊的変更）。利用者が限られている
  今のうちに引数順の記憶負荷がない形へ移行する。CHANGELOG に移行方法を記載する。
- `defineRoutes()` の戻り値（default export）は `{ routes, content, site }` となり、
  ランタイムは routes モジュールだけを見ればよい形を維持する（`08_CONTENT_LAYER.md` 4.2）。
- 型チャネルは従来どおり直接 import（4.1）。ランタイム配線と型配線の二重チャネル構造は
  content と完全に同型である。

### 4.3 Store の拡張: origin と現在ページの path

ランタイム（dev / build）はレンダリングごとに、URL ストアと並べて次を Store へ渡す。

- **site**（宣言されていれば）
- **現在レンダリング中ページの出力 path とその正規形（クリーン URL）**。正規化規則は
  `09_LINK_SAFETY.md` 4.4 の表と同一の関数を共有する（`/index.html` → `/`、
  `/path/to/index.html` → `/path/to/`、`/about.html` → `/about`）。

この上に 2 つの低レベルヘルパーを公開する。ヘルパー・コンポーネントはすべてこの 2 つを
基礎として実装する。

```ts
function absoluteUrl(path: string): string; // ルート相対 path を origin で絶対 URL 化
function pageUrl(): string;                 // 現在ページのクリーン URL を絶対 URL で返す
```

- `absoluteUrl()` は path を Link と同じ `checkLink()` に通す。**存在しないパスを絶対 URL 化
  しようとするとビルドで検出される**（violation は既存の brokenLinks レールに収集）。
- どちらもレンダリング中（ALS コンテキスト内）専用。site 未宣言での呼び出しは 4.7 の
  エラー収集レールに乗る。browser（島内）では動作しない（5 章）。
- 副次効果として、現在ページ path が Store に載ることは `aria-current="page"` 自動付与
  （`09_LINK_SAFETY.md` 6 章）の下準備を兼ねる。

### 4.4 sitemap: `sitemapXml()`

ファイルルートに載せるコンポーネントのファクトリとして提供する。

```ts
// src/routes.ts
import { sitemapXml } from "cirrojs";

route({ type: "file", path: "/sitemap.xml", component: sitemapXml() })
```

```ts
function sitemapXml(opt?: { filter?: (path: string) => boolean }): FileComponent;
```

- **収録対象**: 静的ルート + 動的ルートの全展開 URL を**クリーン URL の正規形**で収録する。
  ファイルルート（json 等）・合成ルート（css / fontawesome）・`public/` 配下は収録しない
  （sitemap は HTML ページの一覧である）。
- `filter` でページを除外できる（引数はクリーン URL の path。`false` で除外）。
- **`lastmod` / `changefreq` / `priority` は出力しない**。`changefreq` / `priority` は主要
  検索エンジンが無視する。`lastmod` は信頼できる情報源（ページごとの更新日時）が現状の
  ルート定義に存在せず、**不正確な lastmod は無いより悪い**ため出力しない（将来候補: 7 章）。
- 出力は sitemap プロトコル準拠の XML（`<urlset>` / `<url><loc>`）。URL は XML エスケープし、
  順序は `expandRoutes()` の展開順（決定的）とする。

### 4.5 RSS: `rssXml()`

item の形はコンテンツ層に依存するため、sitemap と違い**利用者が書くファイルルート
コンポーネントの中で呼ぶ関数**として提供する（この非対称は意図的である。sitemap の材料は
Cirro が全部持っているが、RSS の材料は利用者しか知らない）。

```ts
// src/pages/rss.ts
import { rssXml, type PageProps } from "cirrojs";
import type { content } from "../content";

export function rssFeed({ content }: PageProps<typeof content>) {
    return rssXml({
        items: content.posts.map((post) => ({
            title: post.title,
            path: `/blog/${post.slug}`, // ルート相対。存在がビルド時に検証される
            date: post.date,            // Date
            description: post.description,
        })),
    });
}

// src/routes.ts
route({ type: "file", path: "/rss.xml", component: rssFeed })
```

```ts
interface RssItem {
    title: string;
    path: string;         // ルート相対パス。absoluteUrl() と同じ検証レールに乗る
    date: Date;           // pubDate として出力（Date#toUTCString の RFC 1123 形式）
    description?: string;
}

interface RssOpt {
    items: RssItem[];
    title?: string;       // channel title。既定 site.title
    description?: string; // channel description。既定 site.description（どちらも無ければ違反として報告）
    lang?: string;        // channel language。既定 site.lang（どちらも無ければ省略）
}

function rssXml(opt: RssOpt): string;
```

- 出力は RSS 2.0。channel の `link` はサイトルート（`origin + "/"`）、item の `guid` は
  絶対 URL（`isPermaLink="true"`）とする。
- `title` / `description` を上書きできるのは、タグ別フィードなど**複数フィード**を将来
  作れるようにするためである（channel だけ差し替えて同じ関数で成立する）。
- **`lastBuildDate` は items の date の最大値**とする。現在時刻を使うとビルドが
  非決定的になる（同一入力から同一成果物が出なくなる）ため使わない。
- 各テキストフィールドは XML エスケープする。item の並び順は as-written（利用者がソートする。
  新しい順を推奨としてドキュメントに記載する）。
- 各 item の `path` は `absoluteUrl()` を通るため、**リンク切れ記事がフィードに載ることは
  ビルド時に検出される**。

### 4.6 OGP: `<Ogp>` コンポーネント

`<head>` に OGP メタタグ一式を出力するコンポーネント。React 19 のメタデータ巻き上げにより
ツリーのどこに置いても `<head>` へ巻き上げられる（`04_USAGE.md` 5.4 と同じ機構）。

```tsx
import { Ogp } from "cirrojs";

<Ogp
    title={post.title}
    type="article"
    description={post.description}
    image="/images/ogp/hello.png"
/>
```

```ts
type OgpProps = {
    title: string;                                  // og:title
    type?: "website" | "article";                   // og:type。既定 "website"
    description?: string;                           // og:description。既定 site.description（無ければ省略）
    image?: string;                                 // og:image。ルート相対。存在検証（public 層と照合）
    twitterCard?: "summary" | "summary_large_image"; // twitter:card。指定時のみ出力
};
```

出力するタグ:

| タグ | 値の由来 |
| --- | --- |
| `og:title` | `title` prop |
| `og:type` | `type` prop（既定 `website`） |
| `og:url` | **自動**。`pageUrl()`（現在ページのクリーン URL の絶対形。4.3） |
| `og:site_name` | `site.title` |
| `og:description` | `description` prop → `site.description` → 省略 |
| `og:image` | `image` prop を `absoluteUrl()` で絶対化。省略時は出力しない |
| `twitter:card` | `twitterCard` prop。指定時のみ |

- `og:url` を自動にできるのは「今どのページを描画しているか」を SSG が知っているからであり、
  この機能の核である。利用者はページごとに URL を書かない（書き間違えない）。
- `image` は public 照合（`10_IMAGE_ASSETS.md` 種別 2）と同じレールで存在検証される。
  **OGP 画像の貼り忘れ・パスミスがビルドで落ちる**。
- `<title>` や `<meta name="description">` は出力しない。OGP 専用に徹し、既存の `<head>`
  手書き（またはレイアウト）と役割を分ける。

### 4.7 site 省略時の挙動とエラー報告

- site の宣言は**強制しない**。sitemap / RSS / OGP を使わないサイトは今までどおり動く。
- site が未宣言のまま `absoluteUrl()` / `pageUrl()` / `sitemapXml()` / `rssXml()` / `<Ogp>` を
  使った場合、レンダリング中は throw せず violation（`{ type: "site-required", feature: "Ogp" }`
  等）として Store へ収集し、**dev はコンソール警告、build はページ path 付きでまとめて報告して
  非ゼロ終了**とする。Link / Image と同一の報告レールである（`09_LINK_SAFETY.md` 4.5）。
  エラーメッセージには「`defineSite()` で宣言し `createRouteFn({ site })` に渡す」という
  解決方法を含める。
- RSS の channel description が解決できない場合（opt にも site にも無い）も同じレールで報告する。

## 5. 制約と非目標

- **サブパス配下のデプロイは非対応**（3.5）。origin はスキーム + ホスト（+ ポート）のみ。
- **ヘルパーが受けるのはルート相対パスのみ**（3.4）。外部 URL の OGP 画像等は素の `<meta>` で書く。
- **島（クライアント）内では使えない**。`<Ogp>` / `absoluteUrl()` / `pageUrl()` は SSR 専用と
  する。メタタグは静的部分にのみ意味があり、island 内で使うと hydration mismatch の原因になる
  ため、browser ビルドでの no-op 化は行わず「使わない」を契約とする（ドキュメントに明記）。
- **フィードは RSS 2.0 のみ**（3.6）。
- **OGP 画像の自動生成はしない**（satori 等による動的画像生成はスコープ外）。
- **`lastmod` は出力しない**（4.4。不正確な値を出すくらいなら出さない）。
- ビルドの決定性を崩さない。ヘルパーは現在時刻・乱数を使わない（4.5 の `lastBuildDate` 参照）。

## 6. 実装順序

1. `defineSite` + origin 検証 + `createRouteFn` オブジェクト形式化（破壊的変更・CHANGELOG 記載）
2. Store 拡張（site・現在ページ path）+ `absoluteUrl()` / `pageUrl()` + site-required の報告レール
3. `sitemapXml()`
4. `rssXml()`
5. `<Ogp>`
6. `04_USAGE.md` への使い方の追記、examples/blog への適用（ドッグフーディング）

1・2 が土台で、3〜5 は互いに独立（どの順でもよい）。

## 7. 将来の拡張候補

- **`lastmod` の出力**: ルート定義またはコンテンツ層に更新日時の規約を導入できた場合に再検討。
- **タグ別 RSS などの複数フィード**: 現行 API（channel の上書き + ファイルルート複数宣言）で
  既に成立する。ドキュメントにパターンとして記載する。
- **Atom / JSON Feed ヘルパー**（3.6）。
- **`aria-current="page"` の自動付与**: 4.3 の「現在ページ path が Store にある」を前提に
  `<Link>` 側へ実装（`09_LINK_SAFETY.md` 6 章）。
- **canonical `<link>` の出力**: `pageUrl()` があれば 1 行のコンポーネントで足せる。
- **サブパス配下デプロイ対応**（3.5 の再検討。リンク照合・絶対 URL 化への波及を含む）。

## 付録

### 公開 API（追加分）

| 名前 | 役割 |
| --- | --- |
| `defineSite(config)` | サイトメタデータを検証して宣言する（4.1） |
| `absoluteUrl(path)` | ルート相対 path を絶対 URL 化する。存在検証つき（4.3） |
| `pageUrl()` | 現在レンダリング中ページの絶対 URL（クリーン形）を返す（4.3） |
| `sitemapXml(opt?)` | sitemap のファイルルート用コンポーネントを作る（4.4） |
| `rssXml(opt)` | RSS 2.0 の XML 文字列を生成する（4.5） |
| `<Ogp>` | OGP メタタグ一式を出力するコンポーネント（4.6） |
| `Site` / `SiteConfig` / `RssItem` / `RssOpt` / `OgpProps` 型 | 上記の型 |

### 関連ドキュメント

- `08_CONTENT_LAYER.md` — 二重チャネル配線（値を型の運び屋にする）の原典
- `09_LINK_SAFETY.md` — URL ストア・violation 収集レール・クリーン URL 正規化の原典
- `10_IMAGE_ASSETS.md` — public 照合（og:image の検証が乗るレール）
- `11_TODO.md` — 本書の出発点（課題 2）
