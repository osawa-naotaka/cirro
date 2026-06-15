# 島（islands）システム - 使い方と仕組み

本ドキュメントは、Cirro の中核である「島（islands）アーキテクチャ」について、
**ユーザーから見た使い方**・**バックエンド（ビルド時／クライアント）の動き**・**実装方法**を
解説するものである。憲章（`01_CHARTER.md`）が掲げる「インラインスクリプトゼロ / 厳格 CSP」と
「島が1つもないページは JS ゼロ」を、技術的にどう実現しているかを記録する。

関連: クライアントスクリプトの配信・バンドルの現状は `02_CLIENT_SCRIPT_BUNDLING.md` を参照。

## 1. 島とは何か（概念）

「島（island）」とは、**静的な HTML の海の中に点在する、クライアントでインタラクティブに動く小さな領域**を指す。

- ページの本文（見出し・段落・ナビゲーションなど）は、ビルド時に純粋な静的 HTML へ変換され、
  **クライアントへ JS を一切送らない**。
- インタラクティブにしたい箇所だけを `<Island>` で囲んで宣言する。その箇所だけが、
  クライアントで React によって**ハイドレート**され、状態やイベントを持つようになる。

これにより「本文はゼロ JS、島だけにランタイムが乗る」という軽量さと、
「props はインラインスクリプトでなく `data-*` 属性で渡す」という厳格 CSP の両立を狙う。

## 2. 使い方（ユーザー視点）

島を使うには、ユーザーは **3 つの要素**を用意する。`examples/basic` を例に説明する。

### 2.1 島コンポーネントを書く

ふつうの React コンポーネント。クライアントで動くので `useState` などを自由に使える。

```tsx
// src/islands/Counter.tsx
import { useState } from "react";

export function Counter({ initial = 0 }: { initial?: number }) {
    const [count, setCount] = useState(initial);
    return (
        <button type="button" onClick={() => setCount((c) => c + 1)}>
            count: {count}
        </button>
    );
}
```

### 2.2 レジストリに登録する（純データ）

`registry.ts` の唯一の責務は、**島の名前 → コンポーネントの対応表（`islands`）を export すること**。
ここに登録した名前が、`<Island name="...">` とクライアントの両方から参照される「単一の真実」になる。

```ts
// src/islands/registry.ts
import { Counter } from "./Counter";

export const islands = {
    counter: Counter,
} as const;

export type Islands = typeof islands;
```

> `as const` を付けるのは、`name` の型を `"counter"` のようなリテラル union に絞り、
> 後述の型安全な `<Island>` を成立させるため。

### 2.3 型付きの `<Island>` を生成する

`createIsland(islands)` を呼んで、このプロジェクト専用の `<Island>` コンポーネントを作る。
**5 行の定型コード**だが、これが型安全性の要になっている（理由は 4 章）。

```ts
// src/islands/Island.ts
import { createIsland } from "cirro";
import { islands } from "./registry";

export const Island = createIsland(islands);
```

### 2.4 ページで島を使う

ページ（サーバーで HTML 化される React コンポーネント）の中で `<Island>` を置く。
`name` はレジストリのキー、`props` はその島へ渡す値。

```tsx
// src/pages/home.tsx
import { Island } from "../islands/Island";

export function HomePage() {
    return (
        <html lang="ja">
            {/* ...本文は静的 HTML... */}
            <body>
                <h1>cirro プロトタイプ</h1>
                <p>この本文は静的 HTML です。下のカウンターだけが島です。</p>
                <Island name="counter" props={{ initial: 3 }} />
            </body>
        </html>
    );
}
```

`name` を `registry.ts` に無い名前にしたり、`props` の型が島の引数と合わなければ、
**TypeScript がコンパイル時にエラーにする**。

### 2.5 なぜ registry.ts と Island.ts の 2 ファイルに分かれるのか

一見、`Island.ts` は `registry.ts` に統合できそうに見えるが、**意図的に分離している**。

- `registry.ts` は **純データ**（コンポーネントの対応表だけ）。サーバーとクライアントの**両方**が import する。
- `Island.ts` は `createIsland`（内部で `react-dom/server` の `renderToString` を使う）を引き込むため、
  **サーバー専用**になる。

もし両者を 1 ファイルにまとめると、クライアント（島マウンタ）が registry を import した瞬間に
`renderToString`（サーバー専用コード）がクライアントバンドルへ混入してしまう。
**「純データ層 / サーバー専用層」を分けることで、クライアントには純データだけを渡せる**。
この分離は単なる作法ではなく、軽量化とビルドの健全性のための設計上の制約である。

## 3. バックエンドの動き

ユーザーが書いた `<Island name="counter" props={{ initial: 3 }} />` が、最終的にどう動くか。
**ビルド時（サーバー）→ 生成された HTML → クライアント（ハイドレーション）** の順に追う。

### 3.1 ビルド時（サーバー）: 島を HTML へ展開する

`<Island>` の実体は `createIsland` が返す関数コンポーネントである（`packages/cirro/src/island.tsx`）。
これがサーバーレンダリング時に次を行う。

```tsx
function Island({ name, props }) {
    const html = renderToString(createElement(islands[name], props));
    return createElement("div", {
        "data-island": name,
        "data-props": JSON.stringify(props),
        dangerouslySetInnerHTML: { __html: html },
    });
}
```

1. レジストリから `name` に対応する島コンポーネントを引き、`props` を与えて
   **`renderToString` で島だけを HTML 文字列にする**。
2. それを `<div>` でラップし、3 つの情報を埋め込む。
   - `data-island="counter"` … どの島かを示す名前。
   - `data-props='{"initial":3}'` … 島へ渡す props を **JSON 文字列**で格納。
   - `dangerouslySetInnerHTML` … 1 で作った島の初期 HTML をそのまま中に注入。

結果、生成 HTML はこうなる（初期表示はこの時点で完成しており、JS 到達前から見える）。

```html
<div data-island="counter" data-props='{"initial":3}'>
  <button type="button">count: 3</button>
</div>
```

> **`renderToString` と `renderToStaticMarkup` の違い**: 本文（静的部分）は
> `renderToStaticMarkup`（ハイドレーション用マーカーなし）で出力する。一方、島は後でハイドレートするため
> `renderToString`（マーカー付き）を使う。`createIsland` が島の部分だけ `renderToString` を担うことで、
> 本文はマーカーなしの綺麗な静的 HTML に保てる。

### 3.2 クライアント: 島マウンタが hydrate する

クライアントが読み込むスクリプト（島マウンタ）は、ユーザーは書かない。
Cirro が**仮想モジュール** `virtual:cirro/client` として自動生成する（`packages/cirro/src/vite.ts` の `load()`）。
中身は概ね次のコード。

```js
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { islands } from "<registry.ts の絶対パス>";

for (const el of document.querySelectorAll("[data-island]")) {
    const name = el.dataset.island;
    if (!name || !(name in islands)) continue;
    const props = el.dataset.props ? JSON.parse(el.dataset.props) : {};
    hydrateRoot(el, createElement(islands[name], props));
}
```

1. ページ内の `[data-island]` 要素（= 3.1 で展開された島）をすべて走査する。
2. `data-island` の名前で registry から島コンポーネントを解決する。
3. `data-props` の JSON をパースして props を復元する。
4. その要素を `hydrateRoot` でハイドレートする。

### 3.3 hydrateRoot がしていること（createRoot との違い）

`hydrateRoot` は、**サーバーが既に出力した HTML を作り直さず、そこにイベントと状態を後付けする**。

- `Counter` を `props={initial:3}` で実行し、「本来こうなるはず」の仮想 DOM を作る。
- 要素内に**既にある** `<button>count: 3</button>`（サーバー製）を仮想 DOM と照合し、**再利用**する。
- 既存の `<button>` に `onClick` を接続し、`useState` を初期化する。

対して `createRoot` は、空の要素に**ゼロから DOM を新規生成**する（クライアントオンリー SPA 向け）。

| | `hydrateRoot(el, vdom)` | `createRoot(el).render(vdom)` |
|---|---|---|
| 前提 | `el` 内にサーバー製 HTML が既にある | `el` は空 |
| DOM | 既存を再利用し、振る舞いだけ後付け | 新規生成して挿入 |
| 初期表示 | JS 到達前から見えている | JS が動くまで見えない |
| 用途 | SSR / SSG のハイドレーション | クライアントオンリー SPA |

Cirro は「ビルド時に HTML 化 → 島だけ後から動かす」設計なので、HTML を捨てない `hydrateRoot` が必然。
`createRoot` を使うとサーバー製 HTML を捨てて作り直し、ちらつき（フリッカー）と無駄な再構築を招く。

### 3.4 props を data-* で渡す 2 つの理由

`props` をインラインスクリプトでなく `data-props` 属性に JSON で載せるのは、2 つの目的を兼ねる。

1. **CSP 厳格性**: props 注入のためのインラインスクリプト（`<script>window.__PROPS__=...</script>` のような）を
   一切発生させない。すべての JS は外部ファイルのまま済み、`script-src 'self'` を満たす。
2. **ハイドレーション一致性**: `hydrateRoot` は「サーバー HTML と、クライアントが作る仮想 DOM が一致する」
   ことを前提に DOM を再利用する。サーバーが `initial:3` で描いた HTML を、クライアントも**同じ `initial:3`**
   でハイドレートしなければズレる（hydration mismatch）。`data-props` で同一の値を運ぶことが、この一致を保証する。

> JSON 値は React の `createElement` を通じて属性に設定されるため、属性値のエスケープは React が行う。
> ただし props に文字列を含む場合の XSS 観点（憲章 2.1 技術的制約）は引き続き注意が必要。

### 3.5 仮想モジュールの仕組み

`virtual:cirro/client` は実在しないファイル（**仮想モジュール**）で、Vite プラグインの 2 フックで実体化する。

- `resolveId(id)`: `id` が `"virtual:cirro/client"` なら、先頭に `\0`（ヌル文字）を付けた ID を返す。
  `\0` は「これは実ファイルでなく仮想モジュール」という Vite/Rollup の慣習的な目印で、
  他プラグインが実ファイルとして処理する事故を防ぐ。
- `load(id)`: その解決済み ID に対し、3.2 の島マウンタのソースコードを**文字列として生成して返す**。

この仕組みにより、本来ユーザーが手書きするはずの `client.tsx`（ハイドレーションのエントリ）を、
**Cirro が肩代わりして自動生成**している。

## 4. 実装方法（Cirro 内部）

### 4.1 createIsland ファクトリ（`packages/cirro/src/island.tsx`）

レジストリを受け取り、型付きの `<Island>` を返すファクトリ。型パラメータ `R extends IslandRegistry` に
ユーザーの**具体的な registry の型**を束ねるのが要点。

```tsx
type IslandRegistry = Record<string, ComponentType<any>>;

export function createIsland<R extends IslandRegistry>(islands: R) {
    return function Island<K extends keyof R & string>(
        { name, props }: { name: K; props: ComponentProps<R[K]> },
    ) {
        const html = renderToString(createElement(islands[name], props));
        return createElement("div", {
            "data-island": name,
            "data-props": JSON.stringify(props),
            dangerouslySetInnerHTML: { __html: html },
        });
    };
}
```

- `K extends keyof R & string` … `name` を registry のキーに限定する。
- `props: ComponentProps<R[K]>` … 選んだ島が受け取る props 型に `props` を一致させる。

この「型がユーザーの `islands` から流れてくる」性質が、`Island.ts` をユーザー側に置く理由である。
TypeScript が `<Island>` の型を知るには、呼び出し箇所から `typeof islands`（ユーザー固有の具体型）が
見えている必要があり、それを成立させるのが `createIsland(islands)` の一行である。

### 4.2 Vite プラグイン（`packages/cirro/src/vite.ts`）

`cirro()` は Vite の各フックを持つプラグインオブジェクトを返す。島システムに関わるのは主に次の通り。

| フック | 役割 | 島システムでの意味 |
|---|---|---|
| `config` | Vite 設定を上書き | 島マウンタを単一エントリ（`input.client`）に指定。インライン排除設定（polyfill 無効・inline 無効・manifest 出力）を注入 |
| `configResolved` | 確定設定を読む | registry の絶対パス確定 ＆ `react()` 入れ忘れ検出 |
| `resolveId` | import 指定子を解決 | `virtual:cirro/client` を引き受ける宣言（`\0` 付き ID を返す） |
| `load` | モジュール中身を供給 | 島マウンタ（hydrate コード）を文字列生成 |

CSP 厳格性のためのビルド設定（`modulePreload.polyfill: false` など）の詳細は `01_CHARTER.md` 2.1、
クライアントスクリプトの配信単位は `02_CLIENT_SCRIPT_BUNDLING.md` を参照。

## 5. 制約・注意点

- **hydration mismatch を避ける**: 島のレンダリング結果がサーバーとクライアントで一致している必要がある。
  `Date.now()` / `Math.random()` / `typeof window` 分岐などを島の初期レンダリングに使うと、両者がズレて
  React が警告し、最悪その部分を作り直す。
- **props は JSON シリアライズ可能であること**: `data-props` は `JSON.stringify` / `JSON.parse` を通る。
  関数・クラスインスタンス・`Date` などはそのまま渡せない（文字列等に変換して渡す）。
- **registry に renderToString を混ぜない**: 2.5 のとおり、registry.ts は純データに保つ。サーバー専用コードは
  `Island.ts`（`createIsland` 経由）側に閉じ込める。
- **`Island.ts` は定型だがユーザーが書く**: 現状はこの 5 行をユーザーに記述してもらう方針。型安全性と
  「魔法のなさ（grep でき、追いやすい）」を優先する。隠蔽案は 6 章に将来検討として記録する。

## 6. 将来検討: Island.ts の隠蔽（未実装）

`Island.ts` の定型コードを Cirro 側に隠蔽したい場合、**scaffold（一回生成）ではなく
「仮想モジュール + 自動生成 d.ts」**（Astro の `.astro/types.d.ts` 方式）が本筋である。

- **ランタイム**: `virtual:cirro/island` を `resolveId` / `load` で提供し、
  `export const Island = createIsland(islands)` を自動生成する（`virtual:cirro/client` の延長）。
- **型**: Cirro が `IslandComponent<R>` 型を公開し、CLI（`cirro sync` 等）が registry のパスだけを
  埋めた小さな d.ts を生成する。

  ```ts
  // .cirro/types.d.ts （生成物・ユーザーは触らない）
  declare module "virtual:cirro/island" {
      import type { IslandComponent } from "cirro";
      import type { islands } from "../src/islands/registry";
      export const Island: IslandComponent<typeof islands>;
  }
  ```

- **再生成の範囲**: この d.ts の中身は registry の**パスにのみ**依存し、島の増減は `typeof islands` を通じて
  TypeScript が自動追従する。よって **registry.ts の内容変更を監視して再生成する必要はない**。
  生成は「dev 起動時 / build 時 / 設定（パス）変更による再起動時」の 3 点で足りる。
- **scaffold が不適な理由**: 一回生成は生成直後からユーザー所有物となり、Cirro の API 変更に追従せず
  drift する。scaffold は「ユーザーが育てる種」（starter コンポーネント、ページ雛形）に向く。

現時点では実装せず、明示的な `Island.ts` を維持する。摩擦が増えてから上記方式の導入を検討する。
