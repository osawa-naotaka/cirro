# Cirro スタイリング設計メモ — 島制約とビルド時抽出への検討記録

> **本書の位置づけ**: これは**確定仕様ではなく検討記録（設計メモ）**である。現状の実装仕様は
> `05_STYLING.md` に据え置く。本書は、自前 CSS（render-time collection）の島制約をどう扱うか、
> ビルド時抽出（B-1 自前実装 / vanilla-extract）へ移るべきかを検討した議論の全体を、後から参照できる
> よう一通り書き残したものである。結論は出していない。選択肢とトレードオフの台帳として使う。
>
> 記録日: 2026-06-22

関連: `05_STYLING.md`（現行のスタイリング仕様）、`03_ISLAND_SYSTEM.md`（島システム）。

---

## 1. 出発点 — 何が問題だったか

`05_STYLING.md` 7.3 / 7.4 の島制約が議論の起点。要約すると：

- Cirro の `css()` は **SSR 描画パスで実際に実行された呼び出しだけ**を集めて CSS を生成する
  （render-time collection）。
- そのため、**条件付きマウントされる島の中身**（初期 SSR で描画されない部分）の `css()` は収集されず、
  クラス名は決定的なのに対応する CSS 規則が生成されない → 無スタイルになる。

### 根本原因の切り分け（重要）

この制約は **「ゼロランタイム＋厳格 CSP」という目的から必然に出るものではない**。
**「描画を実行して集める」という収集手段の副作用**である。

- vanilla-extract（`.css.ts` をビルド時評価）、CSS Modules、素の CSS は、いずれもゼロランタイムで
  `style-src 'self'` を満たすが、**何が描画されたかに依存しない**ため、島の条件付きマウント問題は
  最初から存在しない。
- つまり議論の本質は「CSS-in-JS か否か」ではなく **「描画時収集 か ビルド時抽出 か」**。

---

## 2. 現方式を保ったままの緩和策（render-time collection 前提）

### 2.1 第4パターン候補: ファクトリ / スタイル関数で `css()` を前倒し登録する

**アイデア**: `css()` の実行を「コンポーネントの描画（マウント）時」から「ファクトリ呼び出し時」へ
前倒しする。ファクトリを親の描画パス上で**無条件に**呼べば、子を条件付きマウントしても `css()` は
確実に SSR 中に走る。

```tsx
// モジュールスコープでもファクトリ内でもよいが、css() は描画コンテキスト内で走る必要がある
const cssTop = css({ /* ... */ });

export function ComponentA(): ReactNode {
    return <div className={cssTop}>...</div>;
}

export function RootPage(): ReactNode {
    return <div>{open && <ComponentA />}</div>; // マウントは条件付きでも CSS は登録済み
}
```

クラス名は `{selector, atrules, properties}` の djb2 ハッシュで決定的（`css.ts`）なので、後で
クライアントが描画したときに付くクラス名と、生成済み CSS が必ず一致する。

#### 落とし穴: コンポーネントの同一性

ファクトリを**描画本体の中で呼んでコンポーネントを返す**形にすると、描画のたびに新しい関数
コンポーネントが生成され、React がそれを別の型とみなして**アンマウント→再マウント**する
（内部 state が毎回リセット）。

- **ページ（島でない）では無害**（SSR で 1 回描画するだけ）。
- **島の中だと state が壊れる** → `const A = useMemo(() => factory(), [])` で同一性を固定するか、
  下の「スタイル関数」方式を使う。

#### より安全な変種: スタイル関数がクラス名を返す（推奨）

ファクトリにコンポーネントを返させず、**クラス名（の束）**を返させる。コンポーネントはトップレベル
定義のまま props で受け取る。同一性問題が出ない。これは `examples/blog/src/styles/recipes.ts` の
`button()` 等が既に取っている形であり、`05_STYLING.md` 7.3 第3パターンの一般化。

```tsx
function panelStyles() {
    return { top: cssMain({ /* ... */ }), body: cssMain({ /* ... */ }) };
}
function Panel({ styles }: { styles: ReturnType<typeof panelStyles> }) {
    return <div className={styles.top}>...</div>;
}
function Toggle() {
    const [open, setOpen] = useState(false);
    const s = panelStyles();                       // 無条件 → css() 登録は確定
    return <div>{open && <Panel styles={s} />}</div>; // 条件付きマウント OK
}
```

#### パターン比較

| 方式 | 条件付きマウント | 同一性 | 手間 |
| --- | --- | --- | --- |
| 全バリアント評価＋className 差し替え（現 7.3） | △（display:none に倒す） | ◎ | 中 |
| ファクトリがコンポーネントを返す | ◎ | △（島では `useMemo` 必須） | 小〜中 |
| スタイル関数がクラス名を返す（推奨） | ◎ | ◎ | 中（props 配線） |

**重要**: いずれも「(1) 無条件実行の規律」の枠内であり、**制約は消えず「無条件実行を置く場所が移る」
だけ**。ファクトリ呼び出し自体が条件分岐の中に入れば元の木阿弥。ネストした条件マウントでは
ファクトリ/スタイル関数を上から下へ連鎖させる必要があり viral になる。7.4 の理論的限界は不変。

---

## 3. 本当の要求の切り分け

自前 `css()` を採った本来の動機は **「class 名の typo を tsc に潰させたい」= 型付きの class 名変数**。
これは「つまらないバグ」を消すための正当な要求。

ここが核心: **この目的は収集方式と直交している**。class 名を型付き変数として共有できれば、収集が
render-time でなくてもよい。render-time collection は「class 名を変数共有するのに都合がよかった」から
付いてきただけで、必須ではない。

---

## 4. 想定ユースケースの性質 — 現方式に不利な形

- 島は **「少数のアクセント」だが小さいとは限らない**。ポップオーバー / メニュー / 検索窓は、
  ロジックは `useState<boolean>` 数行でも、**子にコンテンツが丸ごと入りスタイルは膨大**になりうる。
- これは render-time collection の **最悪ケース**: 一番大きい CSS が条件付きマウントの裏に隠れる。
  守るために「閉じた初期状態でも中身を丸ごと SSR 描画して収穫」する必要があり、二重に苦しい
  （表示されない巨大サブツリーの SSR 描画 + コロケーションからの乖離）。
- しかもこの場合 **per-route 精度の見返りも薄い**（収穫のため全部描画する＝そのルートに全部載る）。
  島が重いほど制約コストだけが残る。

---

## 5. 選択肢の整理

### A. 現方式を磨く

render-time collection ＋ 語彙レイヤー ＋ 第4パターン（2.1）。島が軽ければ十分。
重い島には不利（4 章）。

### B. 自前 `css()` を「import 時収集」へ作り替える

`css()` がクラス名を返すのは同じだが、レジストリを**描画時ではなくモジュール評価時（import 時）**に
積む。`AsyncLocalStorage` を捨て、モジュールスコープで定義する。

```tsx
const cssTop = css({ /* ... */ }); // モジュールスコープ → import 時に css() が走る
export function ComponentA(): ReactNode {
    return <div className={cssTop}>...</div>; // 普通のトップレベル関数 = 同一性も安定
}
```

これは**島問題（import 時に走るので条件付きマウントと無関係）と同一性問題（安定した関数）を
同時に解く**。型付き変数も保たれる。要は「自前 vanilla-extract」。

**engineering の勘所 — 収集の単位**: モジュールのトップレベルコードはモジュールキャッシュの生存中に
一度しか走らない（描画は毎ルート走るが、import 時の `css()` は初回評価のみ）。よって収集設計が変わる。

- **B-1: グローバル registry に貯めて 1 枚 CSS にまとめる**。import グラフ全体の `css()` の和集合が
  1 枚の `styles.css`。**最も単純**。代償は「ルート A 限定の CSS もルート B に載る」。静的＆島少数の
  サイトなら 1 枚 CSS で十分どころかキャッシュ効率も良い。**当面の第一候補**。
- **B-2: ルートごとの per-route CSS を保つ**。ルートの import グラフを辿り、import したモジュール群の
  `css()` だけを union する。Vite のモジュールグラフで可能だが、「モジュール→そのモジュールの css() 群」
  対応表が要る。**= vanilla-extract のプラグインがやっていることの再発明**。

### C. vanilla-extract を採用する（6 章で詳述）

型付き class 変数 ＋ ビルド時抽出を既製・枯れた形で得る。島問題は原理的に存在しない。
外部依存が増えるが、Panda より表面積が小さく安定。

### 選択肢のトレードオフ

| | 島問題 | 同一性問題 | 型安全 | per-route 精度 | コスト / 依存 |
| --- | --- | --- | --- | --- | --- |
| A 現方式＋規律 | 規律で回避 | ◎ | ◎ | ◎ | 低（既存）／重い島で苦しい |
| B-1 自前 import 時収集・1 枚 | 消える | ◎ | ◎ | ✗（1 枚） | **微修正で済みそう**・無依存 |
| B-2 自前 import 時収集・per-route | 消える | ◎ | ◎ | ◎ | 中（v-e 再発明）・無依存 |
| C vanilla-extract | 消える | ◎ | ◎ | ◎（import 単位） | 外部依存・自前 css() 引退 |

---

## 6. vanilla-extract 調査メモ

### 6.1 概要

`.css.ts` という TypeScript ファイルにスタイルを書き、**ビルド時にそれを実行して静的 CSS を抽出**する
ゼロランタイム CSS-in-JS。`style({...})` は生成された一意クラス名の**文字列**を返す（typo は
コンパイルエラー）。ビルド時評価なので描画に依存せず、**条件付きマウント問題は存在しない**。
成果物は外部 `.css` を `<link>` で読むだけ → `style-src 'self'` を満たす。

```ts
// button.css.ts（ビルド時に実行される）
import { style } from "@vanilla-extract/css";
export const button = style({
    padding: "0.5rem 1rem",
    "@media": { "screen and (min-width: 800px)": { padding: "1rem" } },
});
```
```tsx
import { button } from "./button.css"; // button は型付きの string
export const Button = () => <button className={button}>OK</button>;
```

### 6.2 誰がコンパイルするか

**バンドラのプラグイン**。vanilla-extract 単体に汎用 CLI はない。`.css.ts` の処理は (1) 依存解決・
バンドル → (2) Node 上で実行 → (3) CSS 規則を収集 → (4) CSS アセットを emit ＋ JS の import を
クラス名文字列に書き換え、という丸ごとバンドラの仕事だから。

| 環境 | パッケージ |
| --- | --- |
| Vite | `@vanilla-extract/vite-plugin` |
| Next.js | `@vanilla-extract/next-plugin` |
| webpack | `@vanilla-extract/webpack-plugin` |
| esbuild | `@vanilla-extract/esbuild-plugin` |
| Rollup | `@vanilla-extract/rollup-plugin` |
| 低レベル中核 | `@vanilla-extract/integration`（プラグインが内部利用） |

「フレームワーク無し」でも**バンドラは必要**（`.css.ts` を処理する以上）。esbuild なら最小スクリプトで：

```js
// build.mjs → node build.mjs がコンパイルの引き金
import { vanillaExtractPlugin } from "@vanilla-extract/esbuild-plugin";
import { build } from "esbuild";
await build({ entryPoints: ["src/main.ts"], bundle: true, outdir: "dist",
    plugins: [vanillaExtractPlugin()] });
```

### 6.3 1 枚 CSS にする方法（B-1 相当）

- `.css.ts` を import すると、**そのファイルの全規則が emit される**（1 export しか使わなくても、
  モジュール評価の副作用で全部出る）。全スタイルを 1 ファイルに置いて import すれば 1 枚になる。
- ただし**「出力 1 枚」と「ソース 1 ファイル」は別**。意図ごとに `.css.ts` を分割しても、Vite の
  `build.cssCodeSplit: false` で全 CSS を 1 枚に結合できる。**推奨は「意図ごとに分割 ＋
  `cssCodeSplit: false` ＋ `@layer`」**（辞書の綺麗さと 1 枚出力の両立）。

```ts
// vite.config.ts
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
export default defineConfig({
    plugins: [vanillaExtractPlugin()],
    build: { cssCodeSplit: false },
});
```

### 6.4 `<link>` は誰が挿入するか

- **標準のバンドラ構成**: `.css.ts` の import が JS グラフに「生成 CSS の副作用 import」を注ぐので、
  バンドラが HTML エントリに **`<link>` を自動挿入**する。出力名はハッシュ付き（`foo.css` 固定では
  ない）ので、**名前を当て込んで手でリンクする運用は既定ではない**。
- **自前 HTML を持つ場合（＝ Cirro）**: Vite の `manifest.json` の各エントリの `css: [...]` を読んで
  **自分で `<link>` を挿入**する。Cirro は既に `manifest: true` を注入し client JS の `entry.file` を
  manifest から引いている（`runtime/build.ts`）ので、**同じ manifest の `css` を読んで `<link>` を足す
  だけ**で統合できる。

### 6.5 CSP の注意 — dev とビルドで違う

- **本番ビルド**: CSS は外部 `.css` に抽出 `<link>` 読み込み → `style-src 'self'` を満たす。
- **Vite の dev**: JS が動的に `<style>` を挿入して当てる（HMR のため）→ `style-src 'self'` では
  弾かれる挙動。

つまり vanilla-extract の「CSP クリーン」は**ビルド成果物の性質**で、**dev は `<style>` 注入**。
現状の自前 CSS は dev でも `text/css` 配信でインライン無しを保てている（`05_STYLING.md` 7.1）点が
異なる。なお本プロジェクトの方針は **CSP の厳格化は本番デプロイ時のみ（env で切替）** なので、
dev の `<style>` 注入は許容範囲。

### 6.6 概念対応表

| 自前 css() | vanilla-extract |
| --- | --- |
| `css({...})` | `style({...})` |
| `genCssFn` / `atrules` のメディアクエリ | `"@media"` キー |
| recipe（`button({variant})`） | `styleVariants` / `recipe`（`@vanilla-extract/recipes`） |
| `selector: "& h2"` / reset | `globalStyle(".article h2", {...})` |
| CSS 変数への値逃がし（7.4 の (2)） | `createVar()` / `createTheme()` |
| `@layer base, font, low, main, high` | `layer()` / `globalLayer()` |

唯一の本質的制約は「ビルド時評価なので**実行時にしか決まらない値**は直接書けない（CSS 変数経由）」
こと。ただし Cirro は元々動的インライン style を禁じ、**静的＋メディアクエリ中心の設計**なので、
この制約はほぼ出番なし（= ビルド時抽出が綺麗にハマる領域）。

---

## 7. 命名と「直交した辞書」— layout 層の設計

収集エンジンとは独立した、より本質的な課題。**how ではなく what/why で名付ける**
（例: `margin-inline: auto` ではなく「中央寄せ」）。しかも**直交していて競合しない**辞書が理想。

### 7.1 意図で名付けるレイアウトプリミティブ — Every Layout

"Every Layout"（Heydon Pickering / Andy Bell）が、意図で名付けたレイアウト語彙の枯れた体系。

- **Center**（中央寄せ・最大幅）、**Stack**（縦積み・隣接間だけ余白）、**Cluster**（折返し横並び）、
  **Sidebar**、**Switcher**、**Cover / Grid / Frame / Reel** …
- すべて「何をしたいか」で名付け、how（flex/grid, margin/gap）は実装の内側に隠す。

### 7.2 直交を保つ 2 つの規律

1. **軸を分ける**: 辞書を混ぜない層に分割する。

   | 軸 | 役割 | blog の現状 |
   | --- | --- | --- |
   | トークン | 値の語彙（色・余白スケール・角丸・フォント） | `src/styles/system.ts` ✅ |
   | レイアウト | 配置の意図（Center / Stack / …） | **まだ薄い（次に作る層）** |
   | コンポーネント/レシピ | 見た目のまとまり（button / card） | `src/styles/recipes.ts` ✅ |

   → 既に上下 2 層はあり、**真ん中の「意図で名付けた layout 層」が欠けている**だけ。
   `src/styles/layout.ts` 的に足すイメージ。

2. **プロパティの所有者を一意にする（single-owner-per-property）**: 直交が壊れるのは 2 つの語彙が
   同じプロパティを取り合う瞬間。「兄弟間の余白は Stack/Cluster が所有し、子は自分の margin を
   持たない」のように、各プロパティの番人を一人に決める（Every Layout / CUBE CSS の規律）。

```ts
// layout.ts — 意図で名付け、各々が単一の軸だけを担う
export function center(opts?: { max?: string }): string {
    return cssMain({ box_sizing: "border-box", margin_inline: "auto", max_width: opts?.max ?? "60ch" });
}
export function stack(gap = space(4)): string {
    return cssMain({ margin_top: gap }, { selector: "& > * + *" }); // 隣接兄弟の間にだけ
}
```

### 7.3 型付き関数だから「平坦な名前空間の衝突」が起きない

普通の CSS クラス辞書（`.center` という平坦な名前空間）では同名衝突・特異度戦争が起きる。だが
`center({max})` のような**型付き関数**は、呼ぶたび「意図＋引数」から決定的なクラス名を生成するため、
衝突は CSS の暗黙の上書きではなく **API 設計の問い**になり、tsc が面倒を見る。これは Cirro の設計哲学
（特殊記法より型付き関数）と一致し、自前 css() / vanilla-extract 双方の隠れた強み。

### 7.4 静的デザイン中心は弱点ではなく追い風

「静的＋メディアクエリだけで足りる」設計は、ビルド時抽出（B でも vanilla-extract でも）が
**一点の曇りもなくハマる領域**。7.4 の「動的値・列挙不能・CSS 変数への逃がし」という尻尾が丸ごと
出番なしになる。セキュリティファースト・厳格 CSP の SSG にとって、動的ランタイムスタイリングこそが
敵（`style-src` を緩めさせる元凶）なので、静的志向はプロジェクトの価値観と正しく一致する。

---

## 8. 暫定の方針（2026-06-22 時点・未確定）

- **CSP の厳格化は本番デプロイ時のみ**（env で切替）。dev の `<style>` 注入は許容。
- **Every Layout の読解を先に行う**。layout 層を「why で名付ける」感覚を、コードをいじる前に概念で
  掴むほうが、その後の実装（B でも vanilla-extract でも）が楽になる。
- **B-1 は微修正で済みそう**なので、自前実装も有力候補。1 枚 CSS で当面十分という見立て。
- **vanilla-extract の例をさらに学ぶ**。とくに「直交辞書」の参考として後述の sprinkles を見る。
- **`05_STYLING.md` は現状仕様として据え置き**。本書（doc/06）は検討記録。方針が固まったら 7.3 / 7.4
  ごと書き換える（第4パターンの追記は、移行で制約自体が消える可能性があるため保留＝本書に記録）。

---

## 9. 構造とスタイルの結合 と 将来の診断

DOM 構造とそこに当てるスタイルには強い相関がある。`ul > li`、「このカードは header とその子に h2/h3 を
仮定する」など、**スタイルは特定の DOM 構造を前提とする**ことが多い。`.class1 > li` は当たらなすぎ、
`.class1 > *` は当たりすぎ、という射程の綱引きも同根。これを「構造を仮定したスタイル」としてどう
安全に扱うか。願いは 2 つに分かれる。

- **(a) 構造の強制** — 「このスタイルは header を持つ DOM にしか当てられない」を**型で縛る**。
- **(b) 乖離の検出** — 「いま書いたスタイルと DOM は噛み合っているか」を**気づけるようにする**
  （CSS-in-JS を最初に推した「DOM のすぐ隣に style があれば適合/乖離がすぐわかる」の本体）。

(a)(b) は似て見えるが最適な道具が違う。

### 9.1 (a) 構造の強制 — 「所有コンポーネント ＋ 型付きスロット」

**React/TS で「自由な children のツリー形状」を型検査するのは実用的でない**。`children: ReactNode` は
不透明で、型からタグや入れ子を覗けない。compound component（`<Card><Card.Header/></Card>`）も型では
入れ子を強制できず、規約と実行時に頼るだけ。

現実解は発想の転換で、**構造とスタイルを同一コンポーネントが両方所有し、可変部分だけを型付きスロット
（props）で受ける**。

```tsx
// Card が構造（header>h2）もスタイルも所有する。可変部分だけ型付き props で受ける
function Card({ title, level = 2, children }: { title: string; level?: 2 | 3; children: ReactNode }) {
    const root = cardStyle();        // .card に当たるスタイル
    const head = cardHeaderStyle();  // header に当たるスタイル
    const H = `h${level}` as const;
    return (
        <div className={root}>
            <header className={head}><H>{title}</H></header>
            {children}
        </div>
    );
}
```

これで **`.card > header > h2` という、消費側の DOM に賭けたセレクタが消える**。Card が header を自分で
描画するので、構造とスタイルは乖離しようがない（by construction）。「header が要る」という構造契約は
`title: string` という**型シグネチャそのもの**になり、消費側は内側 DOM を書かないので破綻不能。

#### このモデルの役割分担（重要）

「汎用構造コンポーネント（Card）を用意し、構造にマッチするスタイルを事前に当て、Card 利用時は Props の
型制約で破綻構造を防ぐ」という理解は正しい。ただし機構を分けて捉えると頑健になる。

1. **型が守るのは「境界（入力＝スロット）」**。`title` を要求するのは入力契約であって、DOM↔CSS 一致を
   直接保証するわけではない。
2. **DOM↔CSS の一致は「構成による保証」**。Card が両方を書き、同じ定義内にコロケーションされる。型では
   なく「同居」が一致を担保し、人間の目でも噛み合いが見える。
3. **内部の退行**（markup だけ直してスタイルを直し忘れる等）は、**単体検証（スナップショット）や将来の
   ビルド診断（9.2）**で固定する。型ではここは守れない。
4. **消費側は内側 DOM を書かない**ので破綻構造を作れない。残るリスクは Card *内部*だけに局所化され、
   それを (3) で担保する。

= 「**型＝消費側の境界 / 構成＝構造とスタイルの一致 / テスト・診断＝内部の退行**」の三段。

補助として**ブランド型**で「要素固有スタイルを間違った要素に当てない」ガードは作れる（ツリー形状の検証
ではなく、スロット取り違えの防止に留まる）。

```ts
type HeaderClass = string & { readonly __slot: "header" };
function cardHeaderStyle(): HeaderClass { /* ... */ }
// <div className={cardHeaderStyle()}> を型エラーにできる
```

**完全な構造の型検証は React では諦め、所有コンポーネント＋型付きスロットで“構造を書かせない”ことで
代替する**——これが現実的な落とし所。Card を小さく保ち合成する（Every Layout の小プリミティブ哲学）
ことで、「複雑なコンポーネントだと CSS-in-JS でも読みにくい」問題も避ける。

### 9.2 (b) 乖離の検出 — Svelte の前例と Cirro 固有の強み

**Svelte は、コンポーネントの `<style>` のセレクタがマークアップのどの要素にもマッチしないと
「Unused CSS selector」というコンパイル警告を出す**。これはまさに「スタイルと DOM が噛み合っているか
気づきたい」を、型ではなく**ビルド時解析**で実現したもの。Svelte がこれをできるのは、1 ファイル内に
マークアップとスタイルが同居し、コンパイラが両方を同時に見られるから（Vue scoped style も近い）。

そして **Cirro は構造的に同じ診断ができる立場にいる**。Cirro はビルド時に各ルートの**静的 HTML 文字列**と
生成した**全 CSS 規則（registry）**の両方を手元に持つ（`runtime/build.ts`）。よって後処理で「生成 HTML を
parse し、1 つもマッチしないセレクタ／スタイルの無い要素を警告する」パスが**原理的に書ける**。

- 普通の CSS-in-JS は描画とスタイルが時空間的に分離していて難しい。
- Svelte はコロケーションで解決。
- **Cirro は「静的レンダリング済み」だから解決できる**——Cirro 固有の強みになりうる。

→ 将来の `cirro build --diagnose`（未マッチセレクタ・無スタイル要素の診断）として有望。**型で構造を縛る
より実装可能性が高く、(b) の願いに素直**。

### 9.3 セレクタの射程 と 子孫指定の使い分け

`.class1 > li`（当たらなすぎ）対 `.class1 > *`（当たりすぎ）は、7.2 の「軸を分ける」で解ける。

- **レイアウト軸は要素非依存にして `> *` でよい**。Stack の `& > * + *` が正解で、「子が何であれ等間隔に
  並べる」のが配置の意図。ここで `> li` に絞ると配置という関心に要素種が漏れる。
- **要素固有の見た目（li マーカー、h2 サイズ）は、その要素を所有するコンポーネントが持つ**か、どうしても
  子孫指定が要るなら `> li` で要素を絞る。

逆説として——**子孫セレクタが正当なのは「自分で DOM を描画しない」場所**、つまり Markdown 本文
（`.article h2`）。ここでは構造を**コンテンツパイプライン（remark/rehype）が契約として保証**するので、
型ではなくパイプラインが「header の下に h2」を担保する。**自分で描く DOM では子孫セレクタを避け、所有
コンポーネントに寄せる**——この使い分けが効く。

CSS ネイティブの **`:has()`**（`.card:has(> header h2) { ... }`）は「構造がある時だけ当てる」を表現できるが、
**構造が無ければ黙って何もしない（エラーにならない）**ので、(a) の強制にも (b) の検出にもならない。
**(b) のビルド時診断と併用して初めて安全網になる**。

### 9.4 まとめ

| 願い | 最良の道具 | 実現性 |
| --- | --- | --- |
| 構造を**型で強制** | 所有コンポーネント＋型付きスロット（構造を書かせない）／ブランド型でスロット取り違え防止 | ◎（「自由 children のツリー形状検証」は ✗） |
| 構造との**乖離を検出** | ビルド時の「未マッチ・無スタイル」診断（Svelte 方式）。Cirro は静的 HTML を持つので実装可能 | ◯（Cirro 固有の強み・将来機能） |
| 構造に**条件付け** | CSS `:has()`（黙って失敗するので診断と併用） | ◯（補助） |

「DOM 構造をスタイルの型に織り込む」直接の夢は React/TS では届かないが、**「構造を書かせない所有
コンポーネント（型）」＋「乖離をビルド時に叱る診断（Cirro 固有）」**の二段で、本来欲しかった
「適合/乖離がすぐわかる」にかなり肉薄できる。

---

## 付録

### 参考（外部）

- **Every Layout**（every-layout.dev / Heydon Pickering & Andy Bell）— 意図で名付けたレイアウト
  プリミティブ。layout 層の参照実装。
- **Open Props**（open-props.style / Adam Argyle）— 既製のデザイントークン辞書。token 軸の参考。
- **vanilla-extract**（vanilla-extract.style）— 公式 examples。注目 API:
  - `style` / `styleVariants` … 基本・有限バリアント
  - `@vanilla-extract/recipes` の `recipe` … Panda recipe 相当（component 層）
  - `@vanilla-extract/sprinkles` … プロパティ×許可値を有限・型付きに制約したアトミック語彙生成。
    **「直交辞書」設計の参考に最適**（制約された how 軸。Every Layout の why 軸と補完関係）
  - `createTheme` / `createThemeContract` … トークン軸
  - `globalStyle` / `layer` … reset・子孫セレクタ・`@layer` 戦略の移植先
- **Svelte scoped styles**（svelte.dev）— コンポーネント内の「Unused CSS selector」コンパイル警告。
  スタイル↔DOM 乖離検出の前例（9.2）。
- **CSS `:has()`**（MDN）— 構造を条件にスタイルを当てる CSS ネイティブ機能（9.3。黙って失敗する点に注意）。

### 関連ドキュメント

- `03_ISLAND_SYSTEM.md` — 島システムの使い方と内部の仕組み
- `05_STYLING.md` — 現行のスタイリング仕様（自前 CSS 生成）
</content>
</invoke>
