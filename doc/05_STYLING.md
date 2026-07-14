# Cirro スタイリングガイド（自前 CSS 生成）

Cirro はこれまでスタイリングを Panda CSS に頼っていたが、挙動の不安定さを理由に、
**CSS の生成を自前実装に切り替えた**。本書はその自前 CSS の書き方と内部の仕組みを説明する。

設計の要点は次の 2 つ。

- **ランタイムにスタイルを注入しない**。スタイル登録 API（`toStyle()` や `genCssFn()` が返す css 関数）は
  事前計算済みのクラス名を返すだけで、`<style>` も `style=""` 属性も出さない。生成 CSS は外部ファイル
  （`<link rel="stylesheet">`）として配信される。これにより Cirro の原則どおり
  **`style-src 'self'` まで満たす厳格 CSP** を維持できる。
- **CSS はルート単位に 1 個生成する**。ページを SSR で描画する過程で登録されたスタイルを集め、
  そのルート専用の CSS ファイルとして書き出す。

> Panda CSS は引き続き「非組み込みの選択肢」として利用できるが、本書で説明する
> 自前 CSS が現在の標準である。

関連実装: `packages/cirrojs/src/css.ts` / `registry.ts` / `properties.ts` / `runtime/build.ts` /
`runtime/dev.ts`。利用例: 最小構成は `examples/basic/src/pages/home.tsx`、トークン・レシピを
含むコンポーネント分割の実例は `examples/blog`（`src/styles/`）。

---

## 1. 基本 — ルールノードと `ss()` / `toStyle()`

API は「**ルールノード（CSS を表す小さな AST）を組み立てて登録する**」形をとる。ビルダーは 3 つ。

- `ss(declarations, opt?, ...children)` — **スタイルルール**（セレクタ 1 個＋宣言ブロック＋任意のネストルール）を作る
- `at(prelude, ...children)` — `@layer` / `@media` などの**ブロックアットルール**で子ルールを包む（4 章）
- `atStatement(statement)` — `@layer a, b` のような**文アットルール**を作る（4 章）

組み立てたノードを `toStyle()` に渡すと、レジストリへ登録され、**クラス名（designator）が文字列で返る**。
返ったクラス名を `className` に渡すだけでよい。

```tsx
import { ss, toStyle } from "cirrojs";

export function HomePage() {
    const title = toStyle(ss({ padding: "1rem", font_size: "2rem", color: "#222" }));

    return <h1 className={title}>cirro プロトタイプ</h1>;
}
```

- 戻り値は `cirro-<hash>` 形式のクラス名（例: `cirro-1a2b3c`）。
- `<hash>` は**ルールノードのツリー全体から決まる djb2 ハッシュ**。同じ内容なら常に同じクラス名になるため、
  結果は決定的（deterministic）でビルドごとにブレない。
- スタイルそのものは Cirro 内部の**レジストリ**に登録され、後段でルート用 CSS にまとめて書き出される
  （詳細は 7 章）。
- 毎回 `toStyle(ss(...))` と書くのは冗長なので、通常のコンポーネントスタイルは `genCssFn()`（5 章）で
  生成した関数（`examples/blog` の `cssMain` 等）を使う。本書では以降、`genCssFn()` が返す関数を
  **css 関数**と呼ぶ。

シグネチャ:

```ts
function ss(declarations: Properties, opt?: SsOpt, ...children: RuleNode[]): RuleNode;

type SsOpt = {
    selector?: string;  // セレクタ（既定 "$" = 自クラス参照。3 章）
};

function toStyle(node: RuleNode, opt?: ToStyleOpt): string; // クラス名を返す

type ToStyleOpt = {
    name?: string;      // クラス名の接頭辞（既定 "cirro"）
};
```

ルールノードの型（レジストリが保持する AST そのもの。7.1）:

```ts
type RuleNode = StyleRule | AtBlockRule | AtStatementRule;

type StyleRule = { type: "style"; selector: string; declarations: Declarations; children?: RuleNode[] };
type AtBlockRule = { type: "at-block"; prelude: string; children: RuleNode[] };
type AtStatementRule = { type: "at-statement"; statement: string };
```

ノードを手書きする必要はなく、常にビルダー（`ss` / `at` / `atStatement`）で作ればよい。

---

## 2. プロパティの書き方

### 2.1 アンダースコア区切り（`font_size` → `font-size`）

プロパティ名は **JS の識別子として書けるようアンダースコア区切り**で指定する。CSS へ書き出す際に
ハイフンへ変換される。

```tsx
toStyle(ss({
    font_size: "1.25rem",     // → font-size
    background_color: "#fff",   // → background-color
    border_bottom_width: "2px", // → border-bottom-width
}));
```

プロパティ名と取り得る値は `packages/cirrojs/src/properties.ts` の `Properties` 型で定義されており、
型補完と型チェックが効く。`Properties` は `Partial` なので、必要なプロパティだけを書けばよい。

### 2.2 CSS カスタムプロパティ（変数）

`--` で始まるキーはカスタムプロパティとしてそのまま出力される（アンダースコア変換の対象外）。

```tsx
toStyle(ss({ "--brand": "#0a7", color: "var(--brand)" }));
```

---

## 3. セレクタ — `selector`

`ss()`（および css 関数）の `selector` を省略すると既定値 `"$"` が使われる。`$` は**このスタイルが生成する
クラス自身**に置き換わる。つまり `toStyle(ss({ ... }))` は `.cirro-<hash> { ... }` を生成する。

`$` を使って、生成クラスを基点にした子孫セレクタや擬似クラスを書ける。

```tsx
// .cirro-xxx:hover { ... }
const link = toStyle(ss({ color: "blue" }, { selector: "$:hover" }));

// .cirro-xxx h2 { ... }（Markdown 本文など、自分が要素を持たない箇所へ子孫指定する用途）
const article = toStyle(ss({ margin_top: "2rem" }, { selector: "$ h2" }));
```

置換の細則:

- `$` は先頭に限らず**任意の位置**に書ける。`.parent:has(> $)` のように「自分を子に持つ親要素」を
  狙うセレクタも書ける。
- `$` は `toStyle()` での登録時に**機械的に置換**される（属性後方一致マッチャー `$=` の `$` は除く）。
  引用符内も対象になるため、属性値の文字列に `$` を含むセレクタは当面書けない（将来セレクタパーサー
  導入時に緩和予定）。
- 属性セレクタの後方一致 `[attr$="..."]` は使える。`$=` の `$` は演算子の一部として扱われ置換されない。
- `&` は置換されない。`&` は**ネストルール（11 章）の親参照**としてブラウザに解釈させるトークンであり、
  自クラス参照（`$`）とは別物である。入れ子でない（ネストルール以外の）セレクタに `&` を書くと
  登録時エラーになる（トップレベルの `&` は `:scope` 扱いになり意図とズレるため）。

`$` を含まないセレクタを渡すと、クラスに紐付かない**任意セレクタ**として出力される。リセット CSS の
ように要素そのものへ当てたい場合に使う（この場合、戻り値のクラス名は使わない）。

```tsx
// @layer base { * { margin: 0; padding: 0; } }
toStyle(at("@layer base", ss({ margin: "0", padding: "0" }, { selector: "*" })));
```

---

## 4. アットルール — `at()` / `atStatement()`

`at()` は子ルールをブロックアットルールで包むノードを作る。**外側から内側へのネストは `at()` の入れ子**で
表す。

```tsx
// @media (min-width: 800px) { .cirro-xxx { padding: 1rem; } }
toStyle(at("@media (min-width: 800px)", ss({ padding: "1rem" })));

// @layer main { @media (min-width: 800px) { .cirro-xxx { ... } } }
toStyle(at("@layer main", at("@media (min-width: 800px)", ss({ padding: "1rem" }))));
```

アットルール名は `@layer` / `@media` に限らず、`@supports` / `@container` など**任意のブロック
アットルール**を書ける。ただし CSS 書き出し時に検証があり、`@` + 識別子で始まらないもの、512 文字を
超えるもの、`{` `}` `;` `/*` を含むもの（ブロック注入）はエラーになる（セレクタも同じ検証を受ける）。

`atStatement()` はブロックを持たない**文アットルール**（例: `@layer a, b`）を作る。レジストリの
トップレベル専用で、`toStyle(atStatement("@layer a, b"))` のように登録すると、生成 CSS の固定
プリアンブル（6 章）の直後にまとめて出力される（末尾の `;` は出力時に付与。この場合の戻り値の
クラス名は使わない）。ネストの内側に置くとエラーになる。

---

## 5. css 関数の生成 — `genCssFn()`

決まったレイヤー・メディアクエリ向けの `toStyle(at(..., ss(...)))` を毎回手書きするのは冗長なので、
`genCssFn()` で**アットルールを固定した専用関数（css 関数）**を生成できる。

```ts
type InjectFn = (injected: () => RuleNode) => RuleNode;

function genCssFn(inject: InjectFn): CssFn;

type CssFn = (properties: Properties, opt?: CssFnOpt, ...children: RuleNode[]) => string;

type CssFnOpt = {
    name?: string;      // クラス名の接頭辞（既定 "cirro"）
    selector?: string;  // セレクタ（既定 "$"）
};
```

`genCssFn()` には「**スタイルノードをどこに置くか**」を表すラッパー関数（`InjectFn`）を渡す。
css 関数が呼ばれるたびに、引数から作ったスタイルノードが `injected()` として渡ってくるので、
それを `at()` で包んで返せばよい。

```tsx
import { at, genCssFn } from "cirrojs";

// 「@layer main」用の css 関数
const cssMain = genCssFn((inject) => at("@layer main", inject()));

// 「@layer main かつ PC幅（min-width: 800px）」用の css 関数
const cssPC = genCssFn((inject) => at("@layer main", at("@media (min-width: 800px)", inject())));

const pageTitle = cssPC({ padding: "1rem", font_size: "2rem" });
// → @layer main { @media (min-width: 800px) { .cirro-xxx { padding: 1rem; font-size: 2rem; } } }
```

- 恒等ラッパー（`genCssFn((inject) => inject())`）を渡すと**アットルール無し**（＝どのレイヤーにも
  属さない最優先のスタイル）になる点に注意する。通常のコンポーネントスタイルは `@layer main` を
  明示するのがよい（`examples/blog` の `cssMain` がこの形）。
- css 関数は `properties` と `{ name?, selector? }` に加え、第 3 引数以降に**ネストルール**も
  受け取れる（11 章）。

```tsx
const cssMobileHigh = genCssFn((inject) => at("@layer high", at("@media (max-width: 480px)", inject())));
```

### 5.1 可視性ヘルパーと `responsive()`（サイト側の規約）

`genCssFn()` で作った `cssMain` / `cssPc` / `cssPh`（`examples/blog`・`lulliecat.com` の `styles/system.ts`）を
そのまま生で使うと、**「可視性ゲート」と「ブレークポイント別スタイル」という性質の違う 2 つの関心事が同じ
`cssPc` / `cssPh` に混ざり**、読みにくくなる。サイト側では次の規約で 2 つを分離する（背景と検討経緯は
`07_RESPONSIVE_STYLING.md`）。

**(1) 可視性は意図名ヘルパーで表す。** `display:none` による表示/非表示は「how（`cssPc({display:none})`）」ではなく
「what（PC で隠す / スマホで隠す）」で書く。`styles/system.ts` に **1 組だけ**置いて共有し、ローカル再定義はしない。

```ts
export const hideOnPc = (): string => cssPc({ display: "none" });    // = スマホ専用（PC で隠す）
export const hideOnPhone = (): string => cssPh({ display: "none" }); // = PC 専用（スマホで隠す）
```

- 1 ノードに当てる可視性ヘルパーは 1 つだけにする。
- **可視性を `display:none` で制御するノードの下のスタイルは、原則 `cssMain`（無条件）に戻す。**
  `cssPc` / `cssPh` を「スタイルの置き場所のゲート」として使ったり、`cssFn={cssPc}` のようにブレークポイント関数を
  props で配り歩く（viral threading）のをやめる。代償としてバイトはわずかに増えるが、決定的ハッシュ共有・
  per-route のため誤差であり、可読性を優先する。

**(2) `cssPc` / `cssPh`（= responsive）は「表示中の 1 要素の値がブレークポイントで変わる」場合だけに限定する。**
例: PC だけ `position: sticky`、`$::before { content }` がクリック/タップで変わる、など。複数ブレークポイントの値分岐は
`responsive()` で 1 ブロックに畳むと、同じ要素の宣言が 1 箇所に集まって読みやすい。

```ts
export interface ResponsiveProps {
    base?: Properties; // cssMain（無条件）
    pc?: Properties;   // cssPc（min-width: 900px）
    phone?: Properties; // cssPh（max-width: 899px）
}

export function responsive({ base, pc, phone }: ResponsiveProps): string {
    return cx(base && cssMain(base), pc && cssPc(pc), phone && cssPh(phone));
}

// 使用例: PC だけ sticky にする
const stickyBox = responsive({
    pc: { position: "sticky", top: "74px", max_height: "calc(100vh - 74px)", overflow_y: "auto" },
});
```

- `responsive()` は「1 デザイン内の値分岐」専用。**構造分割（PC/スマホで別物のとき別コンポーネントへ割る）とは別レイヤー**で、
  構造分割には使わない。構造もインタラクションも別物のときは、デザインごとに別コンポーネントへ割り、内部はメディアクエリ
  フリー、切替はマウント地点の `hideOnPc()` / `hideOnPhone()` 1 行に保つ（`PageHeader` の `NavInline` / `NavDrawer` が例）。

---

## 6. レイヤー順序とリセット CSS

生成 CSS の先頭には常に以下が出力される。

```css
@charset "utf-8";
```

cirroでは、明示的なカスケードレイヤーの指定を推奨する。`defineCascadeLayer()`により、カスケードレイヤーの**優先順位**が固定される。

```tsx
export function defineCascadeLayer(layers: string = "base, font, low, main, high"): void {
    toStyle(atStatement(`@layer ${layers}`));
}
```

引数なしで`defineCascadeLayer()`を呼び出すと、デフォルトのカスケードレイヤーが設定される。

```css
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
toStyle(at("@layer base", ss({ margin: "0", padding: "0" }, { selector: "*" })));
```

cirroでは、標準のリセットCSS　`resetCss()`を提供している。この関数を呼ぶことで、以下のスタイルを生成する。

```css
@layer base {
    *, *:before, *:after {
        margin: 0;
        padding: 0;
        border: 0;
        box-sizing: border-box;
        font: inherit;
        color: inherit;
    }

    a {
        color: inherit;
        text-decoration: inherit;
    }

    img, video, canvas, svg {
        display: block;
        max-width: 100%;
        height: auto;
    }

    button {
        cursor: pointer;
    }
}
```

---

## 7. ルート単位の CSS 生成と必須の再 export

### 7.1 仕組み

`toStyle()`（および css 関数）は呼ばれるたびにスタイルを**レジストリ**（`registry.ts`）へ積む。レジストリは
`AsyncLocalStorage`（Node の `node:async_hooks`）で管理され、**レンダリング 1 回ごとに専用の
レジストリが暗黙に引き継がれる**。モジュールグローバルな可変 Map を共有しないため、レンダリングが
インターリーブしても別ルートのスタイル登録が混ざらない（順序依存・初期化忘れの不具合を構造的に排除する）。

ランタイムは各ルートについて、`runWithRegistry()` で描画を包む（`runtime/dev.ts` / `runtime/build.ts`）。

```ts
// runWithRegistry は fn を専用レジストリのコンテキストで実行し、
// fn の戻り値（result）と、描画中に登録されたスタイル（registry）を返す。
const { result, registry } = runWithRegistry(() => renderToStaticMarkup(page.render()));
const css = stringifyCss(registry);
```

1. `runWithRegistry(fn)` が新しい空のレジストリを割り当て、その `AsyncLocalStorage` コンテキスト内で
   `fn` を実行する。
2. `fn` の中でページを `renderToStaticMarkup()` で**ツリー全体まで描画**し、その過程のスタイル登録を
   集める。描画結果の HTML 文字列は破棄し、レジストリだけを使う場合もある（CSS ファイル生成時）。
   トップのページ関数を呼ぶだけでは `Layout` や各島など**ネストしたコンポーネントの関数が実行されず**、
   そのスタイルが収集されない。そのため CSS 生成でも HTML 生成と同じく完全描画する。
   また、描画中に `styleSample()`（7.3）が登録したサンプル要素は、`fn` の完了後に同じコンテキストで
   順に描画され（出力 HTML は破棄）、そのスタイルも同じレジストリへ収集される。
3. `runWithRegistry()` が返した `registry` を `stringifyCss()` で CSS 文字列にする。
4. そのルート専用の CSS ファイルとして書き出す（dev では `text/css` で配信）。

レジストリは `Map<string, RuleNode[]>`（キーは designator）で、値は生成 CSS を表す小さな AST
（`RuleNode` = `StyleRule` | `AtBlockRule` | `AtStatementRule`。1 章）。`StyleRule` はネストルール
（11 章）を `children` に保持し、ネイティブ CSS ネストとして出力される。`toStyle()` が
`registerRules()` を通じて現在のコンテキストのレジストリへ書き込み、`stringifyCss()` が再帰的に
文字列化する。キーは決定的ハッシュなので、同一スタイルの再登録は同一キーへの上書きになり、重複出力が
自然に排除される。文アットルール（`AtStatementRule`）はプリアンブル直後にまとめて出力される（4 章）。
`toStyle()` が描画コンテキスト外（`runWithRegistry` の外）で呼ばれた場合は例外を投げる。

CSS の URL をルート定義で指定する必要はない。dev ではルートの HTML パスに `.css` を付けた URL で
そのルート分の CSS が配信され、build では全ルート分をマージした 1 つの CSS（`/assets/styles.css`）が
書き出されて全ページから参照される。どちらの場合も `<link rel="stylesheet">` はランタイムが自動挿入する
（`04_USAGE.md` 5.4 参照）。

### 7.2 【必須】`routes.ts` で `runWithRegistry` を再 export する

レジストリは `AsyncLocalStorage` のインスタンス（モジュールスコープの状態）に紐付く。ランタイムは
**ルート定義モジュール（`routes.ts`）から import した `runWithRegistry`** で描画を包む。`toStyle()` 側の
`registerRules` と**同一モジュールインスタンス（＝同一の `AsyncLocalStorage`）**を共有させる必要があるため、
利用側の `routes.ts` で `runWithRegistry` を**再 export する必要がある**。

```ts
// src/routes.ts
import { createRouteFn } from "cirrojs";

// ↓ これを書かないと CSS が生成されない
export { runWithRegistry } from "cirrojs";

const { defineRoutes, route } = createRouteFn();

export default defineRoutes(
    route({ type: "static", path: "/index.html", component: HomePage }),
    route({ type: "static", path: "/about.html", component: AboutPage }),
    route({
        type: "dynamic",
        path: ({ slug }) => `/posts/${slug}.html`,
        getStaticPaths: () => [{ slug: "hello" }, { slug: "world" }],
        component: PostPage,
    }),
);
```

### 7.3 【重要】島（ハイドレーション）でのスタイル収集の制約

CSS は **SSR 描画パスで実際に実行されたスタイル登録だけ**を集めて生成する（7.1）。静的（非島）コンテンツは
一度描画した結果がそのまま固定表示されるため、生成 CSS と表示は必ず一致する。問題になるのは
**島（クライアントで再描画される箇所）**である。

> **制約**: 島の中のすべてのスタイル登録（css 関数 / `toStyle()` の呼び出し）は、その島の
> **初期 SSR 描画で必ず実行される**こと。

破綻するのは次のパターン。クラス名（`cirro-<hash>`）は決定的なのでクライアント再描画時に DOM へ付くが、
その状態が初期 SSR 描画で実行されないと、対応する `.cirro-<hash> { ... }` 規則が CSS に**生成されない**。
ランタイムにスタイルを注入しない原則（無注入・`style-src 'self'`）のため、クライアント側で後から補うことも
できず、無スタイルで表示される。

```tsx
// ✗ 破綻例: 初期状態 open=false では <Panel> が描画されず、Panel 内のスタイル登録が一度も走らない
function Toggle() {
    const [open, setOpen] = useState(false);
    return <div>{open && <Panel />}</div>; // Panel が内部で css 関数を呼ぶ → CSS 未生成
}
```

#### 守るためのパターン

- **遅延マウントされる部分は `styleSample()` でサンプルを登録する**。島の本体でサンプル要素を渡して
  おくと、本描画の完了後にサーバー側でだけレンダリングされ（出力 HTML は破棄）、その**子孫コンポーネント
  まで含めた**スタイルが収集される。クライアントでは no-op。ダミー props は実際のレンダリングを通るため、
  スキーマ検証等も通る値にすること。利用例は `examples/blog` の `Disclosure` 島。

  ```tsx
  import { styleSample } from "cirrojs";

  function Toggle() {
      const [open, setOpen] = useState(false);
      styleSample(<Panel />); // Panel とその子孫のスタイルを初期 SSR 描画で収集
      return <div>{open && <Panel />}</div>;
  }
  ```

  なお `Panel({ ... })` のような**コンポーネントの直接呼び出しは代わりにならない**。直接呼び出しは
  関数本体しか実行せず、返り値の JSX 内の子コンポーネントは実行されない（`<Child/>` は要素オブジェクトを
  作るだけで、関数を呼ぶのはレンダラーである）。属性式（`className={recipe()}` 等）だけが評価される
  中途半端な収集になるうえ、呼び先にフックがあると呼び出し元の hook 列に混ざる。`styleSample()` は
  独立したレンダリングルートとして描画するため、どちらの問題もない。

- **全バリアントを無条件に評価し、`className` の差し替えで切り替える**。`examples/blog` の `ScrollTop`
  島がこの形（`base` / `shown` / `hidden` を本体で無条件に登録済みにし、`visible ? shown : hidden` は
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
  常に描画し、`display:none` 用クラスと表示用クラス（両方を無条件に登録済み）を切り替える。
- 子のスタイルが「関数」として切り出せている場合は、**親の本体で子のスタイル関数を先に呼ぶ**
  （例: `const panelClass = panelStyles();` を無条件に実行してクラスを props で渡す）方法もある。
  トークン・レシピを「関数」として用意しておく（`examples/blog` の `src/styles/`）と、この先行登録が
  やりやすい。コンポーネントごと収集したい場合は `styleSample()` を使う。

#### なぜ根本回避が難しいか

「クライアントで初めて現れる DOM のスタイル」を事前に用意する方法は原理的に 3 つしかない。
(1) そのコードを実行してスタイル登録を走らせる（＝全状態を列挙して描画する／一般に列挙不能）、
(2) ソースを静的解析してスタイル登録を全部抽出する（コンパイラが必要・動的値は不可）、
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
   全バリアントを登録済みにできる。`examples/blog` の `src/styles/recipes.ts`（関数化したレシピ）がこの形。
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
toStyle(at("@layer base", ss({ margin: "0", padding: "0" }, { selector: "*" })));

const cssPC = genCssFn((inject) => at("@layer main", at("@media (min-width: 800px)", inject())));
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

- **スタイル登録は描画時に呼ぶ**。レジストリは `runWithRegistry()` が描画ごとに新しく割り当てる
  `AsyncLocalStorage` コンテキストに紐付くため、モジュールのトップレベルで `const x = toStyle(...)` と
  しても描画コンテキスト外となり例外になる。スタイル定義は必ずコンポーネント（または描画時に呼ばれる
  関数）の中で行う。利用例は
  `examples/blog`（トークン・レシピを `src/styles/` に型付き関数として用意し、各コンポーネント内で
  呼び出す）を参照。
- **インラインを出さない原則は維持**。`toStyle()` / css 関数はクラス名を返すだけで `<style>` /
  `style=""` を生成しないため、`style-src 'self'` を満たす（`04_USAGE.md` 10 章の CSP 表と整合）。

---

## 10. レイアウトプリミティブ — `createLayout`（`cirrojs/layout`）

"Every Layout"（every-layout.dev）の「**意図で名付けた**レイアウト語彙」（Stack / Cluster / Center …）を、
css 関数の上に乗せた**型付き関数**として提供する。サブパス `cirrojs/layout` から import する。

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
- 配置の軸は**要素非依存**（`$ > *` 系セレクタ）に保ち、各プロパティの所有者を一意にする
  （single-owner-per-property。`06_STYLING_DIRECTION.md` 7.2）。

### 10.2 `createLayout(theme?)`

`theme` を受け取り、**束縛済みのプリミティブ関数群**を返すファクトリ。利用側で一度だけ呼んで re-export する。

```ts
interface LayoutTheme {
    css?: CssFn;                        // 出力先。省略時 genCssFn((inject) => at("@layer low", inject()))
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
| `cover` | `CoverSlots` | `minHeight`, `gap`, `padding` | `coverMinHeight`=`"100vh"`, `gap`, `gap` |
| `frame` | `string` | `ratio` | `frameRatio`=`"16 / 9"` |
| `reel` | `string` | `itemWidth`, `height`, `gap` | `"auto"`, `"auto"`, `gap` |
| `imposter` | `string` | `fixed`, `contain`, `margin` | `false`, `false`, `"0px"` |
| `box` | `string` | `padding`, `border` | `boxPadding ?? gap`, 省略（線なし） |

`gap` は**大本の `gap` ＋ プリミティブ個別の `stackGap` / `clusterGap` / `gridGap` / `switcherGap` /
`sidebarGap`** の 2 段で、解決順は `引数 ?? 個別既定 ?? 大本 gap`。

補足:
- `frame` は中身 `img` / `video` を `object-fit: cover` で全面に敷く。`reel` は子を `flex: 0 0 <itemWidth>`
  で並べ横スクロールさせる。`imposter` は**親に `position: relative` 等の位置決め**が必要で、`contain` で
  親をはみ出さないよう最大サイズを制限する。
- `box` は padding を持つ枠で、**border は既定で出力しない**（線なし・色なし）。枠線が要る場合は
  `border: "1px solid #ccc"` のように**色を含むショートハンド**を直接渡す（色トークンに依存しない）。
  Every Layout の Box が持つ invert（bg/fg 反転）は提供しない。

### 10.3 sidebar / cover はクラスの束を返す（型付きスロット）

子要素ごとに別スタイルを当てるプリミティブは、**クラス名の束**を返す。消費側が各要素へ明示的に当てるため、
どの子が何かがコードで明快になる。

`sidebar`（主従 2 カラム。左右は DOM の並び順で決まる）:

```tsx
const s = sidebar({ sideWidth: "20rem" });
<div className={s.root}>
    <aside className={s.side}>…</aside>     {/* 従 */}
    <main className={s.content}>…</main>    {/* 主（伸びる・折り返す） */}
</div>
```

`cover`（`centered` を当てた子を縦中央へ、他の子は `gap` で等間隔に並べる）:

```tsx
const c = cover({ minHeight: "100vh" });
<div className={c.root}>
    <header>…</header>
    <h1 className={c.centered}>主役</h1>   {/* 上下 auto マージンで中央 */}
    <footer>…</footer>
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

実装は `packages/cirrojs/src/layout.tsx`、適用例は `examples/blog/src/styles/layout.ts` と各
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

### 10.6 コンポーネント版（単一クラス系）

単一クラスを返すプリミティブ（`stack` / `cluster` / `center` / `grid` / `switcher` / `frame` / `reel` /
`imposter` / `box`）には、**`<div>` を返す PascalCase のコンポーネント版**（`Stack` / `Cluster` / …）も
用意している。**純レイアウト目的の場所**では、関数で `className` を当てるより意図が読みやすい。

```tsx
const { Stack, Cluster } = createLayout({ defaults: { gap: space(4) } });

<Stack gap={space(6)}>
    <Cluster justify="space-between">…</Cluster>
</Stack>
```

- 各コンポーネントはレイアウト用 opts（`gap` 等）と要素属性を受け取り、opts を分離して残りを `<div>` へ
  渡す。要素属性の型は `ElementOpt = Omit<ComponentPropsWithoutRef<"div">, "style">` で、`id` / `aria-*` /
  `data-*` / イベントハンドラ等は通るが、**インライン `style` は型で禁止**している（`style-src 'self'` を
  保つため）。`className` を渡すとレイアウトクラスへ合成される（`cx`）。
- **セマンティック要素**（`ul` / `nav` / `section` / `article` …）には、コンポーネントではなく対応する
  小文字の関数（`stack()` 等）で `className` を当てる。コンポーネント版は常に `<div>` を返すため。
- スロットを返す `sidebar` / `cover` にはコンポーネント版を用意していない（どの子がスロットかを
  コンポーネントで表すと複雑になるため。関数版で `root` / `side` / `content` 等を当てる）。

クラス名の結合には `cx()`（falsy を除外して空白結合）も `cirrojs/layout` から公開している。

```ts
import { cx } from "cirrojs/layout";
<ul className={cx(stack({ gap: space(4) }), cssMain({ list_style: "none", padding: "0" }))}>…</ul>
```

---

## 11. ネストルール — `children`

`ss()` と css 関数は、第 3 引数以降に**ネストルール**（`RuleNode`）を受け取る。base / hover / 子孫 /
メディアクエリを **1 つのクラス名の下に 1 箇所で**書ける。

### 11.1 出力はネイティブ CSS ネスト

ネストルールは**フラット化されず、CSS ネスト（CSS Nesting）構文のまま出力される**。ネスト内の `&` は
生成時に置換されず、**ブラウザがそのまま解釈する**（意味論は CSS ネスト仕様そのもの: `:is()` ラップ、
`&` を含まないセレクタへの暗黙の子孫結合、`.parent:has(> &)` のような親側参照など）。

> **ブラウザ要件**: 生成 CSS は CSS Nesting 対応ブラウザ（Chrome 120+ / Safari 17.2+ /
> Firefox 117+、2023 年以降のエバーグリーン）を前提とする。Cirro は生成 CSS を PostCSS 等で
> 後処理しないため、ネスト構文がそのまま配信される。

```tsx
const card = cssMain(
    { color: "#222" },
    { name: "card" },
    ss({ color: "#0a7" }, { selector: "&:hover" }),              // 自分の :hover
    ss({ color: "#a70" }, { selector: "&:focus, &:active" }),    // カンマ区切りも可（ネイティブ仕様どおり）
    ss({ text_decoration: "none" }, { selector: "& a" },
        ss({ text_decoration: "underline" }, { selector: "&:hover" })), // & は直近の親（= & a）を指す
    ss({ border: "1px solid #ccc" }, { selector: ".parent:has(> &)" }), // 自分を子に持つ親要素
    ss({ margin: "0" }, { selector: "> li" }),                   // 結合子始まりの相対セレクタ
    at("@media (min-width: 800px)",
        ss({ padding: "2rem" }, { selector: "&" }),              // アットルール内も & 基点で書く
        ss({ color: "#07a" }, { selector: "&:hover" }),
    ),
);
// → @layer main { .card-x { color: #222; &:hover { ... } &:focus, &:active { ... }
//      & a { text-decoration: none; &:hover { ... } } .parent:has(> &) { ... } > li { ... }
//      @media (min-width: 800px) { & { padding: 2rem; } &:hover { ... } } } }
```

### 11.2 制約

- ハッシュはルールノードのツリー全体から決まる。**1 呼び出し = 1 クラス名**で、全ネストルールがそれを
  参照する。
- **ネスト内のセレクタに自クラス参照の `$` は書けない（登録時エラー）**。ただし属性後方一致
  マッチャー `$=` の `$` は自クラス参照ではないため許容される。仮に `$` を置換すると、置換結果
  （`.cirro-x`）は `&` を含まないため**暗黙の子孫結合**が働き、「ルート参照のつもりが
  `& .cirro-x`（子孫セレクタ）」という無言のズレになる。これを防ぐため `toStyle()` が拒否する。
  `ss()` の既定セレクタは `"$"` なので、**ネストルールでは `selector` の明示が必須**になる。
  ネスト内の自己参照・親参照は `&` で書く。
- セレクタ・アットルールの検証（4 章）はネスト内にも適用される。文アットルール（`atStatement`）は
  ネストの内側に置けない。

---

## 12. キーフレーム — `toKeyframes()`

`toKeyframes()` はフレーム群（`ss()` で作ったスタイルルール）から `@keyframes` を登録し、
**アニメーション名**（`animation` / `animation-name` に渡す文字列）を返す。戻り値はクラス名ではない。

```ts
function toKeyframes(frames: RuleNode[], opt?: ToKeyframesOpt): string; // アニメーション名を返す

type ToKeyframesOpt = {
    name?: string;    // 名前の接頭辞（既定 "cirro-kf"）
    wrap?: InjectFn;  // @layer 等の外側アットルールで包む（genCssFn と同じ形式）
};
```

```tsx
const spin = toKeyframes([
    ss({ transform: "rotate(0deg)" }, { selector: "from" }),
    ss({ transform: "rotate(360deg)" }, { selector: "to" }),
]);
const loader = cssMain({ animation: `${spin} 1s linear infinite` });

// @layer main の中に置く場合
const pulse = toKeyframes(
    [ss({ opacity: "0.4" }, { selector: "0%, 100%" }), ss({ opacity: "1" }, { selector: "50%" })],
    { wrap: (fn) => at("@layer main", fn()) },
);
```

- 名前は**フレーム内容から決まる決定的ハッシュ**（既定接頭辞 `cirro-kf`）。同じフレーム定義なら常に
  同じ名前になり、レジストリ上で自然に重複排除される（手動命名と違い、名前の衝突管理が不要）。
- フレームのセレクタは `from` / `to` / `<数値>%`、およびそれらの**カンマ区切りリスト**（`"0%, 100%"`）。
  それ以外（`ss()` の既定セレクタ `"$"` を含む）は登録時エラーになるため、**フレームでは `selector` の
  明示が必須**。フレームにネストルールは書けない。
- `wrap` はハッシュに含まれない。同一フレーム内容を異なる `wrap` で複数回登録した場合、名前が同じに
  なるため最後の 1 件だけが出力される点に注意。
- `at("@keyframes 名前", ...)` を `toStyle()` に渡す手動命名も引き続き可能（名前の衝突管理は利用側の
  責任になる）。

---

## 付録

### 公開 API（`cirrojs`）

| 名前 | 役割 |
| --- | --- |
| `ss(declarations, opt?, ...children)` | スタイルルールノードを作る（1 章） |
| `at(prelude, ...children)` | ブロックアットルールノードを作る（4 章） |
| `atStatement(statement)` | 文アットルールノードを作る（4 章） |
| `toStyle(node, opt?)` | ルールノードを登録しクラス名を返す（1 章） |
| `toKeyframes(frames, opt?)` | `@keyframes` を登録しアニメーション名を返す（12 章） |
| `genCssFn(inject)` | アットルールを固定した css 関数を生成する（5 章） |
| `styleSample(element)` | サンプル要素を登録する。本描画の完了後に描画され、遅延マウントされる部分のスタイルも収集される（7.3。クライアントでは no-op） |
| `runWithRegistry(fn)` | `fn` を専用レジストリのコンテキストで実行し、戻り値とレジストリを返す（ランタイムが呼ぶ／`routes.ts` で再 export） |
| `Properties` 型 | 指定可能なプロパティ名と値の型 |
| `Registry` 型 | レジストリ（`Map<string, RuleNode[]>`）の型 |
| `RuleNode` / `StyleRule` / `AtBlockRule` / `AtStatementRule` 型 | レジストリが保持する CSS AST の型（1 章・7.1）。`Declarations` 型は `cirrojs/registry` から公開 |
| `CssFn` / `CssFnOpt` 型 | css 関数の型と、その第 2 引数の型（5 章） |
| `InjectFn` 型 | `genCssFn()` の引数（スタイルノードの配置を決めるラッパー関数）の型（5 章） |
| `SsOpt` / `ToStyleOpt` / `ToKeyframesOpt` 型 | `ss()` / `toStyle()` / `toKeyframes()` の第 2 引数の型（1 章・12 章） |

### 公開 API（`cirrojs/layout`）

| 名前 | 役割 |
| --- | --- |
| `defineCascadeLayer(layerName?)` | `layerName` でカスケードレイヤーを定義する（11 章）デフォルトは `"base, font, low, main, high"` |
| `resetCss()` | デフォルトのリセット CSS を適用する |
| `createLayout(theme?)` | Every Layout プリミティブ（関数: stack / cluster / center / grid / switcher / sidebar / cover / frame / reel / imposter / box、コンポーネント: Stack / Cluster / Center / Grid / Switcher / Frame / Reel / Imposter / Box）を既定値で束縛して返す（10 章） |
| `cx(...classes)` | falsy を除外してクラス名を空白結合する |
| `LayoutTheme` 型 | `createLayout` の引数（`{ css?, defaults? }`） |
| `LayoutDefaults` 型 | 各プリミティブの既定値 |
| `Layout` 型 | `createLayout` の戻り（プリミティブ関数群＋コンポーネント群） |
| `ElementOpt` 型 | コンポーネント版が受ける要素属性（`Omit<ComponentPropsWithoutRef<"div">, "style">`） |
| `SidebarSlots` 型 | `sidebar` の戻り（`{ root, side, content }`） |
| `CoverSlots` 型 | `cover` の戻り（`{ root, centered }`） |

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（背景・目的・スコープ）
- `03_ISLAND_SYSTEM.md` — 島システムの使い方と内部の仕組み
- `04_USAGE.md` — 利用ガイド（ルーティング・コンテンツ層・Markdown・CSP）
