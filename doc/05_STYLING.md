# Cirro スタイリングガイド（自前 CSS 生成）

Cirro はこれまでスタイリングを Panda CSS（`04_USAGE.md` 9 章）に頼っていたが、挙動の不安定さを理由に、
**CSS の生成を自前実装に切り替えた**。本書はその自前 CSS の書き方と内部の仕組みを説明する。

設計の要点は次の 2 つ。

- **ランタイムにスタイルを注入しない**。`css()` は事前計算済みのクラス名を返すだけで、`<style>` も
  `style=""` 属性も出さない。生成 CSS は外部ファイル（`<link rel="stylesheet">`）として配信される。
  これにより Cirro の原則どおり **`style-src 'self'` まで満たす厳格 CSP** を維持できる。
- **CSS はルート単位に 1 個生成する**。ページを SSR で描画する過程で呼ばれた `css()` を集め、
  そのルート専用の CSS ファイルとして書き出す。

> Panda CSS は引き続き「非組み込みの選択肢」として利用できるが（`04_USAGE.md` 9 章）、本書で説明する
> 自前 CSS が現在の標準である。

関連実装: `packages/cirrojs/src/css.ts` / `registry.ts` / `properties.ts` / `runtime/build.ts` /
`runtime/dev.ts`。利用例: 最小構成は `examples/basic/src/pages/home.tsx`、トークン・レシピを
含むコンポーネント分割の実例は `examples/blog`（`src/styles/`）。

---

## 1. 基本 — `css()`

`css()` にスタイルを渡すと、そのスタイルに対応する**クラス名（designator）を文字列で返す**。
返ったクラス名を `className` に渡すだけでよい。

```tsx
import { css } from "cirrojs";

export function HomePage() {
    const title = css({ padding: "1rem", font_size: "2rem", color: "#222" });

    return <h1 className={title}>cirro プロトタイプ</h1>;
}
```

- 戻り値は `cirro-<hash>` 形式のクラス名（例: `cirro-1a2b3c`）。
- `<hash>` は **プロパティ部分（第 1 引数）の内容から決まる djb2 ハッシュ**。同じプロパティなら常に同じ
  クラス名になるため、結果は決定的（deterministic）でビルドごとにブレない。
- スタイルそのものは Cirro 内部の**レジストリ**に登録され、後段でルート用 CSS にまとめて書き出される
  （詳細は 7 章）。

シグネチャ:

```ts
function css(properties: Properties, opt?: CssOpt): string;

type CssOpt = {
    name?: string;      // クラス名の接頭辞（既定 "cirro"）
    atrules?: string[];   // @layer / @media などのアットルール（外側から内側の順）
    selector?: string;  // セレクタ（既定 "&"）
};
```

---

## 2. プロパティの書き方

### 2.1 アンダースコア区切り（`font_size` → `font-size`）

プロパティ名は **JS の識別子として書けるようアンダースコア区切り**で指定する。CSS へ書き出す際に
ハイフンへ変換される。

```tsx
css({
    font_size: "1.25rem",     // → font-size
    background_color: "#fff",   // → background-color
    border_bottom_width: "2px", // → border-bottom-width
});
```

プロパティ名と取り得る値は `packages/cirrojs/src/properties.ts` の `Properties` 型で定義されており、
型補完と型チェックが効く。`Properties` は `Partial` なので、必要なプロパティだけを書けばよい。

### 2.2 CSS カスタムプロパティ（変数）

`--` で始まるキーはカスタムプロパティとしてそのまま出力される（アンダースコア変換の対象外）。

```tsx
css({ "--brand": "#0a7", color: "var(--brand)" });
```

---

## 3. セレクタ — `selector`

`selector` を省略すると既定値 `"&"` が使われる。`&` は**このスタイルが生成するクラス自身**に置き換わる。
つまり `css({ ... })` は `.cirro-<hash> { ... }` を生成する。

`&` を使って、生成クラスを基点にした子孫セレクタや擬似クラスを書ける。

```tsx
// .cirro-xxx:hover { ... }
const link = css({ color: "blue" }, { selector: "&:hover" });

// .cirro-xxx h2 { ... }（Markdown 本文など、自分が要素を持たない箇所へ子孫指定する用途）
const article = css({ margin_top: "2rem" }, { selector: "& h2" });
```

`&` を含まないセレクタを渡すと、クラスに紐付かない**任意セレクタ**として出力される。リセット CSS の
ように要素そのものへ当てたい場合に使う（この場合、戻り値のクラス名は使わない）。

```tsx
// * { margin: 0; padding: 0; }
css({ margin: "0", padding: "0" }, { selector: "*", atrules: ["@layer base"] });
```

---

## 4. アットルール — `atrules`

`atrules` には `@layer ...` や `@media (...)` などのアットルールを**外側から内側の順に**並べる。
セレクタはこれらの内側に入れ子で出力される。

```tsx
// @media (min-width: 800px) { .cirro-xxx { padding: 1rem; } }
css({ padding: "1rem" }, { atrules: ["@media (min-width: 800px)"] });

// @layer main { @media (min-width: 800px) { .cirro-xxx { ... } } }
css({ padding: "1rem" }, { atrules: ["@layer main", "@media (min-width: 800px)"] });
```

`atrules` → `selector` → プロパティの順で内側に入れ子になる、と覚えればよい。

---

## 5. メディアクエリ用ヘルパー — `genCssFn()`

決まったレイヤー・メディアクエリ向けの `css()` を毎回手書きするのは冗長なので、`genCssFn()` で
**アットルールを固定した専用関数**を生成できる。

```ts
function genCssFn(mediaAtRule: string, layer?: string): CssFnT; // layer 既定 "main"
```

```tsx
import { genCssFn } from "cirrojs";

// 「PC幅（min-width: 800px）かつ @layer main」用の css 関数
const cssPC = genCssFn("min-width: 800px");

const pageTitle = cssPC({ padding: "1rem", font_size: "2rem" });
// → @layer main { @media (min-width: 800px) { .cirro-xxx { padding: 1rem; font-size: 2rem; } } }
```

`genCssFn` が返す関数は `properties` と `{ name?, selector? }` を受け取る（`atrules` は固定済みなので
渡せない）。第 2 引数 `layer` を変えれば書き込み先レイヤーを切り替えられる。

```tsx
const cssMobileHigh = genCssFn("max-width: 480px", "high");
```

---

## 6. レイヤー順序とリセット CSS

生成 CSS の先頭には常に以下が出力され、カスケードレイヤーの**優先順位**が固定される。

```css
@charset "utf-8";
@layer base, font, low, main, high;
```

優先度は右ほど高い。意図と対応づけると次のとおり。

| レイヤー | 想定用途 |
| --- | --- |
| `base` | リセット CSS・要素デフォルト |
| `font` | フォント関連の宣言 |
| `low` | 低優先のユーティリティ |
| `main` | 通常のコンポーネントスタイル（`genCssFn` の既定） |
| `high` | 最優先で上書きしたいスタイル |

リセット CSS は `@layer base` に入れておけば、後続の `main` などに確実に上書きされる。

```tsx
// reset css（base レイヤーへ）
css({ margin: "0", padding: "0" }, { selector: "*", atrules: ["@layer base"] });
```

---

## 7. ルート単位の CSS 生成と必須の再 export

### 7.1 仕組み

`css()` は呼ばれるたびにスタイルをモジュールスコープの**レジストリ**（`registry.ts`）へ積む。
ランタイムは各ルートについて次を行う（`runtime/dev.ts` / `runtime/build.ts`）。

1. `initCssRegistry()` でレジストリを空にする
2. ページを `renderToStaticMarkup()` で**ツリー全体まで描画**し、その過程の `css()` 呼び出しを集める。
   描画結果の HTML 文字列は破棄し、レジストリだけを使う。トップのページ関数を呼ぶだけでは
   `Layout` や各島など**ネストしたコンポーネントの関数が実行されず**、その `css()` が収集されない。
   そのため CSS 生成でも HTML 生成と同じく完全描画する。
3. `getCssRegistry()` で集めたレジストリを取り出し、`stringifyCss()` で CSS 文字列にする
4. そのルート専用の CSS ファイルとして書き出す（dev では `text/css` で配信）

レジストリは**配列**で、同一セレクタの重複を許容する（重複排除はしない）。これは異なるメディア
クエリ・レイヤーで同じセレクタを複数回出すための仕様。

CSS の URL は `expandRoutes()`（`router.ts`）が決める。

- 静的ルート `"/about"` → `/about/index.css`
- 動的ルートは `cssPath` で明示する。`examples/basic` では `/posts/[slug]` 系で `/posts/index.css` を
  共有している（動的ルートの全インスタンスで 1 CSS を共有）。

### 7.2 【必須】`routes.ts` でレジストリ関数を再 export する

レジストリはモジュールスコープの状態であり、ランタイムは**ルート定義モジュール（`routes.ts`）から
import した `initCssRegistry` / `getCssRegistry`** を使ってこの状態を読み書きする。同じモジュール
インスタンスを共有させるため、利用側の `routes.ts` で両関数を**再 export する必要がある**。

```ts
// src/routes.ts
import { type AnyRoute, route } from "cirrojs";

// ↓ これを書かないと CSS が生成されない
export { initCssRegistry, getCssRegistry } from "cirrojs";

export const routes: AnyRoute[] = [
    { path: "/", component: HomePage },
    { path: "/about", component: AboutPage },
    route({
        path: ({ slug }) => `/posts/${slug}`,
        cssPath: "/posts/index.css",
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    }),
];
```

---

## 8. 生成例

入力:

```tsx
css({ margin: "0", padding: "0" }, { selector: "*", atrules: ["@layer base"] });

const cssPC = genCssFn("min-width: 800px");
const pageTitle = cssPC({ padding: "1rem", font_size: "2rem" });
// pageTitle === "cirro-xxxxxx"
```

出力 CSS（`stringifyCss` による）:

```css
@charset "utf-8";
@layer base, font, low, main, high;
@layer base { * { margin: 0; padding: 0; } }
@layer main { @media (min-width: 800px) { .cirro-xxxxxx { padding: 1rem; font-size: 2rem; } } }
```

---

## 9. 現状の制約と注意

- **クラス名はプロパティのみから算出される**。`selector` や `atrules` はハッシュに含まれない。
  したがって同じプロパティ集合は、セレクタ・メディアクエリが違っても同じクラス名になる。レイヤーと
  メディアで正しくカスケードされるため通常は問題にならないが、クラス名は「スタイル内容の指紋」だと
  理解しておくとよい。
- **重複排除はしない**。まったく同じ `css()` を 2 回呼べば、CSS にも同じ規則が 2 回出る。
- **`css()` は描画時に呼ぶ**。レジストリはルート描画の直前に `initCssRegistry()` で空にされるため、
  モジュールのトップレベルで `const x = css(...)` としても import 時に一度登録されるだけで描画前に
  消える。スタイル定義は必ずコンポーネント（または描画時に呼ばれる関数）の中で行う。利用例は
  `examples/blog`（トークン・レシピを `src/styles/` に型付き関数として用意し、各コンポーネント内で
  呼び出す）を参照。
- **インラインを出さない原則は維持**。`css()` はクラス名を返すだけで `<style>` / `style=""` を生成
  しないため、`style-src 'self'` を満たす（`04_USAGE.md` 10 章の CSP 表と整合）。

---

## 付録

### 公開 API（`cirrojs`）

| 名前 | 役割 |
| --- | --- |
| `css(properties, opt?)` | スタイルを登録しクラス名を返す |
| `genCssFn(mediaAtRule, layer?)` | アットルールを固定した `css` 関数を生成する |
| `initCssRegistry()` | レジストリを初期化する（ランタイムが呼ぶ／`routes.ts` で再 export） |
| `getCssRegistry()` | レジストリを取得する（ランタイムが呼ぶ／`routes.ts` で再 export） |
| `Properties` 型 | 指定可能なプロパティ名と値の型 |
| `CssOpt` 型 | `css()` の第 2 引数の型 |

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（背景・目的・スコープ）
- `03_ISLAND_SYSTEM.md` — 島システムの使い方と内部の仕組み
- `04_USAGE.md` — 利用ガイド（ルーティング・CSP・Panda CSS）
