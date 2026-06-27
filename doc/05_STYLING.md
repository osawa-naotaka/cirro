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
**アットルールを固定した専用関数**を生成できる。引数はオプションオブジェクトで受け取る。

```ts
type GenCssFnOpt = {
    mediaAtRule?: string; // @media のルール本体（括弧なし。例 "min-width: 800px"）
    layer?: string;       // @layer 名。省略するとどのレイヤーにも属さない
};

function genCssFn(opt: GenCssFnOpt): CssFnT;
```

`layer` と `mediaAtRule` の指定有無に応じて `@layer` / `@media` のアットルールが組み立てられる。
**どちらも省略すると、アットルール無し**（＝どのレイヤーにも属さない最優先のスタイル）になる点に注意する。
通常のコンポーネントスタイルは `layer: "main"` を明示するのがよい（`examples/blog` の `cssMain` がこの形）。

```tsx
import { genCssFn } from "cirrojs";

// 「@layer main かつ PC幅（min-width: 800px）」用の css 関数
const cssPC = genCssFn({ mediaAtRule: "min-width: 800px", layer: "main" });

const pageTitle = cssPC({ padding: "1rem", font_size: "2rem" });
// → @layer main { @media (min-width: 800px) { .cirro-xxx { padding: 1rem; font-size: 2rem; } } }
```

`genCssFn` が返す関数は `properties` と `{ name?, selector? }` を受け取る（`atrules` は固定済みなので
渡せない）。`layer` を変えれば書き込み先レイヤーを切り替えられる。

```tsx
const cssMobileHigh = genCssFn({ mediaAtRule: "max-width: 480px", layer: "high" });
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
| `low` | 低優先のユーティリティ・レイアウトプリミティブ（`createLayout` の既定。10 章） |
| `main` | 通常のコンポーネントスタイル（`cssMain` 等で明示的に指定する） |
| `high` | 最優先で上書きしたいスタイル |

リセット CSS は `@layer base` に入れておけば、後続の `main` などに確実に上書きされる。

```tsx
// reset css（base レイヤーへ）
css({ margin: "0", padding: "0" }, { selector: "*", atrules: ["@layer base"] });
```

---

## 7. ルート単位の CSS 生成と必須の再 export

### 7.1 仕組み

`css()` は呼ばれるたびにスタイルを**レジストリ**（`registry.ts`）へ積む。レジストリは
`AsyncLocalStorage`（Node の `node:async_hooks`）で管理され、**レンダリング 1 回ごとに専用の
レジストリが暗黙に引き継がれる**。モジュールグローバルな可変 Map を共有しないため、レンダリングが
インターリーブしても別ルートの `css()` が混ざらない（順序依存・初期化忘れの不具合を構造的に排除する）。

ランタイムは各ルートについて、`runWithRegistry()` で描画を包む（`runtime/dev.ts` / `runtime/build.ts`）。

```ts
// runWithRegistry は fn を専用レジストリのコンテキストで実行し、
// fn の戻り値（result）と、描画中に css() が登録したレジストリ（registry）を返す。
const { result, registry } = runWithRegistry(() => renderToStaticMarkup(page.render()));
const css = stringifyCss(registry);
```

1. `runWithRegistry(fn)` が新しい空のレジストリを割り当て、その `AsyncLocalStorage` コンテキスト内で
   `fn` を実行する。
2. `fn` の中でページを `renderToStaticMarkup()` で**ツリー全体まで描画**し、その過程の `css()` 呼び出しを
   集める。描画結果の HTML 文字列は破棄し、レジストリだけを使う場合もある（CSS ファイル生成時）。
   トップのページ関数を呼ぶだけでは `Layout` や各島など**ネストしたコンポーネントの関数が実行されず**、
   その `css()` が収集されない。そのため CSS 生成でも HTML 生成と同じく完全描画する。
3. `runWithRegistry()` が返した `registry` を `stringifyCss()` で CSS 文字列にする。
4. そのルート専用の CSS ファイルとして書き出す（dev では `text/css` で配信）。

レジストリは `Map<designator, [selectors, properties]>` で、`css()` が `registerCss()` を通じて
現在のコンテキストのレジストリへ書き込む。`css()` が描画コンテキスト外（`runWithRegistry` の外）で
呼ばれた場合は例外を投げる。

CSS の URL は `expandRoutes()`（`router.ts`）が決める。

- 静的ルート `"/about"` → `/about/index.css`
- 動的ルートは `cssPath` で明示する。`examples/basic` では `/posts/[slug]` 系で `/posts/index.css` を
  共有している（動的ルートの全インスタンスで 1 CSS を共有）。

### 7.2 【必須】`routes.ts` で `runWithRegistry` を再 export する

レジストリは `AsyncLocalStorage` のインスタンス（モジュールスコープの状態）に紐付く。ランタイムは
**ルート定義モジュール（`routes.ts`）から import した `runWithRegistry`** で描画を包む。`css()` 側の
`registerCss` と**同一モジュールインスタンス（＝同一の `AsyncLocalStorage`）**を共有させる必要があるため、
利用側の `routes.ts` で `runWithRegistry` を**再 export する必要がある**。

```ts
// src/routes.ts
import { type AnyRoute } from "cirrojs";

// ↓ これを書かないと CSS が生成されない
export { runWithRegistry } from "cirrojs";

export const routes: AnyRoute[] = [
    { type: "static", path: "/", component: HomePage },
    { type: "static", path: "/about", component: AboutPage },
    {
        type: "dynamic",
        path: ({ slug }) => `/posts/${slug}`,
        cssPath: "/posts/index.css",
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    },
];
```

### 7.3 【重要】島（ハイドレーション）でのスタイル収集の制約

CSS は **SSR 描画パスで実際に実行された `css()` だけ**を集めて生成する（7.1）。静的（非島）コンテンツは
一度描画した結果がそのまま固定表示されるため、生成 CSS と表示は必ず一致する。問題になるのは
**島（クライアントで再描画される箇所）**である。

> **制約**: 島の中のすべての `css()` は、その島の**初期 SSR 描画で必ず実行される**こと。

破綻するのは次のパターン。クラス名（`cirro-<hash>`）は決定的なのでクライアント再描画時に DOM へ付くが、
その状態が初期 SSR 描画で実行されないと、対応する `.cirro-<hash> { ... }` 規則が CSS に**生成されない**。
ランタイムにスタイルを注入しない原則（無注入・`style-src 'self'`）のため、クライアント側で後から補うことも
できず、無スタイルで表示される。

```tsx
// ✗ 破綻例: 初期状態 open=false では <Panel> が描画されず、Panel 内の css() が一度も走らない
function Toggle() {
    const [open, setOpen] = useState(false);
    return <div>{open && <Panel />}</div>; // Panel が内部で css() を呼ぶ → CSS 未生成
}
```

#### 守るためのパターン

- **全バリアントを無条件に評価し、`className` の差し替えで切り替える**。`examples/blog` の `ScrollTop`
  島がこの形（`base` / `shown` / `hidden` を本体で無条件に `css()` 済みにし、`visible ? shown : hidden` は
  登録済みクラスを選ぶだけ）。状態が変わっても未生成クラスは出ない。

  ```tsx
  function ScrollTop() {
      const [visible, setVisible] = useState(false);
      const base = cssMain({ /* ... */ });
      const shown = cssMain({ opacity: "1", /* ... */ });   // 無条件に登録
      const hidden = cssMain({ opacity: "0", /* ... */ });  // 無条件に登録
      return <button className={cx(base, visible ? shown : hidden)}>↑</button>;
  }
  ```

- **条件付きマウントより「CSS で表示/非表示」を優先**する。`{open && <Modal/>}` ではなく `<Modal/>` を
  常に描画し、`display:none` 用クラスと表示用クラス（両方を無条件に `css()` 済み）を切り替える。
- どうしても遅延マウントが必要な子は、**親の本体で子のスタイル関数を先に呼ぶ**
  （例: `const panelClass = panelStyles();` を無条件に実行してクラスを props で渡す）。トークン・レシピを
  「関数」として用意しておく（`examples/blog` の `src/styles/`）と、この先行登録がやりやすい。

#### なぜ根本回避が難しいか

「クライアントで初めて現れる DOM のスタイル」を事前に用意する方法は原理的に 3 つしかない。
(1) そのコードを実行して `css()` を走らせる（＝全状態を列挙して描画する／一般に列挙不能）、
(2) ソースを静的解析して `css()` を全部抽出する（コンパイラが必要・動的値は不可）、
(3) ランタイムで CSS を注入する（`style-src 'self'` の方針で封印済み）。
(3) を採らない以上、残るのは (1) の規律か (2) の静的抽出であり、本書は **(1) の規律（上記パターン）を
制約として課す**立場をとる。

> 関連: 島システム全体は `03_ISLAND_SYSTEM.md`。同 5 章「制約・注意点」にも本制約への参照がある。

### 7.4 なぜこの制約は原理的に残るか — 緩和はできるが除去はできない

7.3 の制約は**緩和できるが完全には除去できない**。これは実装の未成熟ではなく、計算機科学的な限界による。

#### 理論的背景

「あるプログラムが取りうる CSS 規則の全集合を、任意の入力に対して求める」のは一般に**決定不能**である。
停止性問題そのものというより、より一般の **Rice の定理**（プログラムの非自明な意味的性質はすべて決定不能）の
系であり、停止性問題はその代表的な還元先になる。したがって静的解析にできるのは原理的に次の 3 つだけである。

1. **言語を制限する** — 値の集合が有限・列挙可能になるよう表現力を削る（決定可能にする）
2. **過大近似する** — 健全な上位集合を取る（取りこぼさない代わりに膨張・誤検出）
3. **実行する（オラクル）** — ランタイム、あるいは「ビルド時実行」という*部分*オラクル

重要な点として、**ビルド時に実行しても限界は消えない**。ビルド時に分かるのはビルド時定数だけで、
ユーザー入力や fetch 結果など*実行時にしか定まらない値*は依然として列挙できない。

#### 他フレームワークの戦略（いずれも一般解ではない）

- **ランタイム＝オラクル**（styled-components / Emotion 等）: 描画時にスタイルを計算して `<style>` に注入。
  動的値が何でも動くが、代償は**ランタイム注入**と CSP（`style-src 'unsafe-inline'` か nonce/hash）。Cirro が
  禁じたもの。なお SSR 時の「描画パスで出た分だけ集める」収集は Cirro と同じで、違いは**クライアントでも
  注入を続ける後半**を持つこと。Cirro はそこを切ったため本制約が表面化した。
- **静的抽出＋言語制限**（Tailwind / Panda / vanilla-extract 等）: JS を評価せず、または有限の宣言済み集合に
  限定して網羅する。Tailwind は*リテラル*クラス名のみ拾い「クラス名を動的生成するな」を制約として明文化
  （逃げ道は `safelist`）。Panda は動的を **recipe（variant）= 有限・宣言済みの値空間**に寄せて網羅列挙する。
  vanilla-extract は `.css.ts` をビルド時に実行する（部分オラクル）が、実行時依存の値は扱えない。
- **CSS カスタムプロパティ**（多くが最後に収束する答え）: 動的値を「新しい規則」ではなく「既存規則の値」に
  変える。`color: var(--c)` という*値非依存の静的規則*を 1 個だけ生成し、ランタイムは `--c` の値だけ
  差し替える。**列挙問題そのものを消す**のが効く。

#### Cirro における緩和の階層

Cirro はゼロランタイム陣営の中でもさらに厳格で、変数を渡すための inline `style=""` すら避ける
（`style-src 'self'` は `style` 属性も封じる）。よって制約は必然的に残り、現実的な緩和は次の順で行う。

1. **有限 variant に寄せる**（Panda recipe 方式）。取りうる見た目が宣言済みの有限集合なら、初期 SSR 描画で
   全バリアントを `css()` 済みにできる。`examples/blog` の `src/styles/recipes.ts`（関数化したレシピ）がこの形。
2. **CSS 変数を CSSOM 経由で差し替える**。`var(--c)` の静的規則は SSR で生成し、島の JS が
   `element.style.setProperty("--c", v)` で値を入れる。CSP の `style-src` は**宣言的な inline スタイル**を
   規制するもので、許可済み外部スクリプトからの **CSSOM 操作は規制しない**ため、`style-src 'self'` を保ったまま
   *真に動的な値*を扱える（「構造＝静的・有限／値＝実行時」に分離する王道）。
   ※この CSSOM と CSP の関係は、対象ブラウザ・実運用 CSP で最終確認すること。
3. **規則自体が実行時に増えるケース**（任意セレクタ・任意宣言の動的生成）は、ランタイム注入以外に手段がなく、
   Cirro の方針では原理的に不可。ここは **7.3 の制約として残す**。

まとめ: 一般解を持つフレームワークは存在せず、各実装は「ランタイム注入で殴る／有限に制限する／値を CSS 変数に
逃がす」のいずれかを選んでいる。Cirro はランタイム注入を捨てた以上、**(1)(2) で緩和し、残りは制約として明示する**
のが妥当な落とし所である。

---

## 8. 生成例

入力:

```tsx
css({ margin: "0", padding: "0" }, { selector: "*", atrules: ["@layer base"] });

const cssPC = genCssFn({ mediaAtRule: "min-width: 800px", layer: "main" });
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
- **`css()` は描画時に呼ぶ**。レジストリは `runWithRegistry()` が描画ごとに新しく割り当てる
  `AsyncLocalStorage` コンテキストに紐付くため、モジュールのトップレベルで `const x = css(...)` としても
  描画コンテキスト外となり例外になる。スタイル定義は必ずコンポーネント（または描画時に呼ばれる関数）の
  中で行う。利用例は
  `examples/blog`（トークン・レシピを `src/styles/` に型付き関数として用意し、各コンポーネント内で
  呼び出す）を参照。
- **インラインを出さない原則は維持**。`css()` はクラス名を返すだけで `<style>` / `style=""` を生成
  しないため、`style-src 'self'` を満たす（`04_USAGE.md` 10 章の CSP 表と整合）。

---

## 10. レイアウトプリミティブ — `createLayout`（`cirrojs/layout`）

"Every Layout"（every-layout.dev）の「**意図で名付けた**レイアウト語彙」（Stack / Cluster / Center …）を、
`css()` / `genCssFn()` の上に乗せた**型付き関数**として提供する。サブパス `cirrojs/layout` から import する。

```ts
import { createLayout } from "cirrojs/layout";
```

### 10.1 設計方針

- **値はすべて単位付きの文字列**で渡す（基本単位 rem。例 `"1rem"` / `"56rem"`）。`space(n)` のような
  スケール段数の注入はしない。
- **既定値は `createLayout` の `defaults` で集中設定・上書きできる**（依存性注入）。レイアウトのロジックは
  cirro 側が所有し、デフォルトの起点だけを利用側へ開放する。これにより、ライブラリが配るレイアウト関数でも
  利用者がデフォルトを差し替えられる。
- **出力先は既定で `@layer low`**。component レシピ（`button` 等＝`@layer main`）より下に置くことで、
  component 側が常にレイアウトを上書きできる正しいカスケードになる。`theme.css` を渡せば変更できる。
- 配置の軸は**要素非依存**（`& > *` 系セレクタ）に保ち、各プロパティの所有者を一意にする
  （single-owner-per-property。`06_STYLING_DIRECTION.md` 7.2）。

### 10.2 `createLayout(theme?)`

`theme` を受け取り、**束縛済みのプリミティブ関数群**を返すファクトリ。利用側で一度だけ呼んで re-export する。

```ts
interface LayoutTheme {
    css?: CssFnT;                       // 出力先。省略時 genCssFn({ layer: "low" })
    defaults?: Partial<LayoutDefaults>; // 既定値の部分上書き
}

function createLayout(theme?: LayoutTheme): Layout;
```

各プリミティブの引数と既定値（`LayoutDefaults`）:

| 関数 | 戻り | 主な引数（単位付き文字列） | 既定 |
| --- | --- | --- | --- |
| `stack` | `string` | `gap` | `stackGap ?? gap`（gap=`"1rem"`） |
| `cluster` | `string` | `gap`, `justify`, `align` | `clusterGap ?? gap`, `flex-start`, `center` |
| `center` | `string` | `max`, `gutters`, `intrinsic`, `andText` | `centerMax`=`"60ch"` |
| `grid` | `string` | `gap`, `min` | `gridGap ?? gap`, `gridMin`=`"16rem"` |
| `switcher` | `string` | `threshold`, `gap`, `limit` | `"30rem"`, `switcherGap ?? gap`, `4` |
| `sidebar` | `SidebarSlots` | `sideWidth`, `contentMin`, `gap` | `"auto"`, `sidebarContentMin`=`"50%"`, `sidebarGap ?? gap` |

`gap` は**大本の `gap` ＋ プリミティブ個別の `stackGap` / `clusterGap` / `gridGap` / `switcherGap` /
`sidebarGap`** の 2 段で、解決順は `引数 ?? 個別既定 ?? 大本 gap`。

### 10.3 sidebar はクラスの束を返す（型付きスロット）

主従 2 カラムの `sidebar` だけは、2 要素それぞれに別スタイルを当てるため**クラス名の束**
（`{ root, side, content }`）を返す。消費側が各要素へ明示的に当て、主従はコードで明快になる。左右は
DOM の並び順で決まる。

```tsx
const s = sidebar({ sideWidth: "20rem" });
<div className={s.root}>
    <aside className={s.side}>…</aside>     {/* 従 */}
    <main className={s.content}>…</main>    {/* 主（伸びる・折り返す） */}
</div>
```

### 10.4 利用例

```ts
// src/styles/layout.ts — サイトの既定値で束縛して re-export
import { createLayout } from "cirrojs/layout";
import { space } from "./system";

export const { stack, cluster, center, grid, switcher, sidebar } = createLayout({
    defaults: { gap: space(4), centerMax: "56rem" },
});
```

```tsx
// 利用側
import { stack, cluster, center } from "../styles/layout";

<main className={center({ gutters: space(4) })}>      {/* 中央寄せ・最大幅は既定 56rem */}
    <div className={stack({ gap: space(5) })}>…</div>  {/* 縦積み */}
    <div className={cluster({ gap: space(2) })}>…</div> {/* 折返し横並び */}
</main>
```

配置軸（`stack` の flex/gap）と装飾（list-reset 等）は所有を分けて合成するとよい。

```tsx
<ul className={cx(stack({ gap: space(4) }), cssMain({ list_style: "none", padding: "0" }))}>…</ul>
```

実装は `packages/cirrojs/src/layout.ts`、適用例は `examples/blog/src/styles/layout.ts` と各
コンポーネント（`PostList` / `PostMeta` / `Layout` など）を参照。

### 10.5 生成 CSS 例

```tsx
const { stack, center } = createLayout({ defaults: { gap: "1.5rem" } });
stack({ gap: "2rem" });
center({ gutters: "1rem" });
```

```css
@layer low { .cirro-xxxxxx { display: flex; flex-direction: column; gap: 2rem; } }
@layer low { .cirro-yyyyyy { box-sizing: border-box; margin-inline: auto; max-inline-size: 60ch; } }
@layer low { .cirro-zzzzzz { padding-inline: 1rem; } }
```

---

## 付録

### 公開 API（`cirrojs`）

| 名前 | 役割 |
| --- | --- |
| `css(properties, opt?)` | スタイルを登録しクラス名を返す |
| `genCssFn(opt)` | アットルール（`{ mediaAtRule?, layer? }`）を固定した `css` 関数を生成する |
| `runWithRegistry(fn)` | `fn` を専用レジストリのコンテキストで実行し、戻り値とレジストリを返す（ランタイムが呼ぶ／`routes.ts` で再 export） |
| `Properties` 型 | 指定可能なプロパティ名と値の型 |
| `Registry` 型 | レジストリ（`Map<designator, [selectors, properties]>`）の型 |
| `CssOpt` 型 | `css()` の第 2 引数の型 |

### 公開 API（`cirrojs/layout`）

| 名前 | 役割 |
| --- | --- |
| `createLayout(theme?)` | Every Layout プリミティブ（stack / cluster / center / grid / switcher / sidebar）を既定値で束縛して返す（10 章） |
| `LayoutTheme` 型 | `createLayout` の引数（`{ css?, defaults? }`） |
| `LayoutDefaults` 型 | 各プリミティブの既定値 |
| `Layout` 型 | `createLayout` の戻り（プリミティブ関数群） |
| `SidebarSlots` 型 | `sidebar` の戻り（`{ root, side, content }`） |

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（背景・目的・スコープ）
- `03_ISLAND_SYSTEM.md` — 島システムの使い方と内部の仕組み
- `04_USAGE.md` — 利用ガイド（ルーティング・CSP・Panda CSS）
