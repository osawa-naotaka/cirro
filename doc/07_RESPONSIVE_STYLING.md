# Cirro レスポンシブ・スタイリング設計メモ — PC/スマホ切替と「可視性／スタイル置き場」の分離

> **本書の位置づけ**: これは PC 向け / スマホ向けデザインの切替手法と、そこで肥大化した `css()` 呼び出しを
> どう整理するかを議論した**検討記録 + 確定方針**である。現状の実装仕様は `05_STYLING.md`、その背景の
> 検討経緯は `06_STYLING_DIRECTION.md` に置く。本書は、それらの上で具体のサイト（`lulliecat.com`）を
> 題材に「読みにくさの正体」を切り分け、対処方針とタスクへ落とし込んだものである。
>
> **結論は出している**が、本書時点で**コード修正は未実行**。修正は後日、第 8 章のタスクリストに沿って行う。
>
> 記録日: 2026-06-30

関連: `05_STYLING.md`（現行スタイリング仕様）、`06_STYLING_DIRECTION.md`（収集方式・直交辞書の検討記録）、
`03_ISLAND_SYSTEM.md`（島システム）。

---

## 1. 出発点 — 何に困っていたか

Cirro は "Every Layout" を参考にしたレイアウトプリミティブ（`cirrojs/layout`）を提供し、メディアクエリに
頼らないレイアウトを志向している。しかし実運用では、

- PC 向けデザインとスマホ向けデザインを**かなり変える**ことが多く、メディアクエリに頼らざるを得ない箇所が多い。
- そもそも**提供する情報の順番**を PC とスマホで変えることがある。
- そのため「スマホ用 DOM」「PC 用 DOM」を両方用意し、`display:none` をメディアクエリで当てて片方を消す、という
  手法を多用している。

結果として、これらのスタイルが各コンポーネントに散らばり、**見通しの悪い `css()` / `cssPc()` / `cssPh()` 呼び出し**が
積み重なっていた。

当初の検討候補は次の 3 案だった。

1. vanilla-extract のように `.css.ts` へスタイルを一括で寄せる。
2. `pageHeaderTitleDescription` のように**階層化したフラットな変数名**で命名して定義を外出しする。
3. DOM 階層に対応した**ネストオブジェクト**（途中ノードは `.self`、葉はそのままアクセス）で定義する。

一方、現手法の利点（捨てがたい点）も自覚していた。

- `.tsx` 内でレイアウト構造が**目に見える**（コロケーション）。
- いちいち名付けせずに**直接スタイルを当てられ**、命名の手間がない。

---

## 2. 問題の切り分け — 2 つの別問題が混ざっていた

議論の結果、相談には**性質の異なる 2 つの問題**が混在していると分かった。

- **(A) スタイル定義をどこに置き、どう名付けるか**（`.css.ts` 一括 / 階層変数名 / ネストオブジェクト / インライン）。
- **(B) PC とスマホで DOM を分け、`display:none` で切り替える手法**そのもの。

そして `css()` が散らかる**主因は (B)** であり、(A) の置き場所・命名をいじっても根は残る、という整理に至った。
以降は (B) を先に扱い、その上で (A) を論じる。

---

## 3. 二重 DOM + `display:none` の評価

### 3.1 まず `order` / `grid-area` で代替できないか

「順番を変えたいだけ」なら、DOM を二重化せず、1 本の DOM に対して `order`（flex/grid）や
`grid-template-areas` をメディアクエリで差し替えるほうが筋がよい。DOM が 1 本なら重複もバイト増も乖離も生じない。

- 注意点: `order` は**視覚順と DOM 順が乖離**する（タブ順・スクリーンリーダーは DOM 順に従う）。「見た目の並べ替え」は
  許容、「読み上げ順そのものを変えたい／構造が別物」になるなら別手段。

→ **方針**: `order` / `grid-area` で消せる二重化はまず消す。ただし「構造もインタラクションも別物」「別の親に
配置したい」ケースは `order` では届かないため、二重 DOM が正当になる（4 章・5 章のケース）。

### 3.2 二重 DOM の「良い版」と「悪い版」

二重 DOM 自体が悪いのではない。**悪いのは 1 コンポーネント内で `cssPc`/`cssPh` が交錯する版**であり、
**良い版は「デザインごとに別コンポーネントへ割り、内部はメディアクエリフリー、切替はマウント地点の
`display:none` 1 行」**に保たれている（doc/06 §9.1 の「所有コンポーネント」と `single-owner-per-property` に一致）。

---

## 4. ケーススタディ A — `PageHeader`（二重 DOM の「良い版」）

対象: `islands/PageHeader.tsx`、`components/section/PageHeader/NavInline.tsx`、`.../NavDrawer.tsx`。

- PC = トップバー内の**横一列インライン nav**（`NavInline`、静的寄り）。
- スマホ = ハンバーガー → 右からスライドインする**ドロワー**（`NavDrawer`、暗背景・大フォント・縦並び・SNS を別ブロック、
  `Slider` で開閉状態を持つ**インタラクティブ**）。

これは並べ替えではなく**構造もインタラクションも別物**で、`order` では畳めない。二重 DOM が正当な典型例。

**良い点（評価）**:

- `NavInline` / `NavDrawer` が**それぞれ 1 デザインだけ**を書き、内部はメディアクエリフリー
  （`NavDrawer` のコメント「メディアクエリの分岐は無い」）。
- 切替はマウント地点の**1 行 `display:none`**に局所化（`NavInline` の `cssPh({display:none})`、
  `NavDrawer` の `cssPc({display:none})`）。

**残る小改善**:

- `NavDrawer` で `cssPc({display:none})` が**2 回**書かれている（`root` 定義の中と `<Slider>` の `className` の中）。
  決定的ハッシュなので出力 CSS は重複しないが、「PC で隠す」の所有者があいまいで消し忘れの芽。**1 箇所に決める**。
- `cssPc({display:none})` は意図が弱い。Cirro の「how でなく what/why で名付ける」哲学に沿って、
  **意図名ヘルパー**（`hideOnPc()` / `hideOnPhone()`）に置き換える。

---

## 5. ケーススタディ B — `PostPage`（二重 DOM の「悪い版」＝今回の主訴）

対象: `pages/blog/PostPage.tsx` → `Sidebar`(main/side) → `components/section/Posts/PostPane.tsx`(main) /
`SidePane.tsx`(side)。関連島: `islands/TocCard.tsx`、`islands/SeriesCard.tsx`、`components/element/Accordion.tsx`。

### 5.1 このページが実際にやっていること

- 目次(`tocCard`)とシリーズ(`seriesCard`)**だけ**を、スマホでは `PostPane`（記事本文の上部・インライン）、
  PC では `SidePane`（右の sticky サイドバー）に置く。**同じ島を 2 回レンダリングし、`display:none` で片方ずつ消す**。
- 本文カラムとサイドバーカラムという**別の親**へ置きたいので、CSS の並べ替え（`order`/`responsive`）では届かない。
  → **二重レンダリング + `display:none` はここでは正当**。

### 5.2 島が 2 インスタンスなのは正当（重複ではない）

当初「同じ島の二重ハイドレートはコストでは」と疑ったが、`PostPane` 側の `tocCard` は `closeOnClick`
（リンククリックでアコーディオンを閉じる）、`SidePane` 側は `initialState:true`（常時開いてサイドバーに置く）で、
**挙動の異なる 2 インスタンス**であり消すべき重複ではない。

- `Accordion` を島にできない理由 = `Accordion` は children を props で受け取り、**children はシリアライズできず
  `data-*` に載らない**（doc/01 の「props は `data-*` で渡す」制約）。よって島の境界を、シリアライズ可能な props
  （`toc: ToC[]` / `closeOnClick` など）を持つ `TocCard` に置き、`Accordion` は島の内部で children から組む、という
  切り方は正しい。**島の境界はシリアライズ可能な props を持つ層に引く**。

### 5.3 スタイル収集（§7.3）との関係 — 検証の結果「堅牢」

懸念: PostPane の toc は初期 closed。中身を条件付きマウントしていると、閉じた SSR では内部 `css()` が走らず
`05_STYLING.md` §7.3 で無スタイルになるのでは。

検証結果: **問題なし**。`Accordion.tsx` は

```tsx
<div className={cx(childrenRoot, props.isOpen && "is-open")}>{content}</div>
```

のように **`{content}` を isOpen に関係なく常にレンダリング**し、開閉は `height:0` ↔ `&.is-open { height: calc-size(...) }`
という **CSS クラスの差し替え**で行う。よって閉じていても `TocCard` 内部の `css()` は SSR で走り、**各コピーが
自己完結**する（PC コピーへの依存はない）。これは §7.3 の推奨パターン（条件付きマウントを避け CSS で表示/非表示）を
正しく実践した形であり、`TocCard` / `Accordion` の内部は綺麗で手を入れる必要はない。

### 5.4 読みにくさの正体 — 2 つの関心事の癒着 + 綴りの不揃い

このページのノイズは「二重 DOM だから」ではなく、**別々の 2 つの関心事が 1 つの式に癒着**し、しかも
**綴りが場所ごとにバラバラ**だから、というのが診断。

1. **可視性**（このノードはどちらのブレークポイントで出すか）。
2. **ブレークポイント別スタイリング**（`cssFn` を recipe に通してスタイルをそのメディアクエリ下に置く）。

具体的な症状:

- 可視性の綴りが不揃い: `SidePane` ではローカルに `const hideOnPhone = cssPh({display:none})` を定義しているのに、
  `PostPane` では生の `cssPc({display:none})` をインライン。**同じ意図が 2 つの綴り・2 つの場所**にある
  （= 共通化したいサイン）。
- `cssFn` の viral threading: `focusableCard(cssPh)` / `focusableCard(cssPc)` が複数箇所、
  `FocusableCard cssFn={cssPc}` / `StackWithSeparator cssFn={cssPc}` と**ブレークポイント関数を props で配り歩く**。
  さらに `SidePane` ではコンテナが `cssPc` なのに中のカードは `focusableCard(cssPh)` と**混在**しており、追いにくい
  （doc/06 §2.1 が警告した viral threading が現実に起きている）。

### 5.5 `cssPc`/`cssPh` の正しい唯一の用途を示す実例

`Accordion.tsx` の `exprain`:

```tsx
cssPc({ content: "'クリック'" }, { selector: "&::before" }),
cssPh({ content: "'タップ'" }, { selector: "&::before" }),
```

これは**表示されている 1 要素の値（文言）がブレークポイントで変わる**ケースで、`cssPc`/`cssPh`（= responsive）の
**正しい用途**。一方 PostPane/SidePane での `cssPc`/`cssPh` は「可視性ゲート」に使われている。**同じ関数名で 2 用途が
混ざっている**ことが読みにくさの根。`exprain` は残し、可視性側は `hideOnPc`/`hideOnPhone` に逃がす、という線引きが
この実例で裏付けられた。

---

## 6. (A) 置き場所・命名についての結論

実物を見た上で、当初の 3 案（`.css.ts` 一括 / 階層変数名 / ネストオブジェクト）に対する結論。

- **全面 `.css.ts` 化・ネストオブジェクトは見送り**。
  - ネストオブジェクト（`.self` 方式）は、DOM ツリーを `.tsx` と**二重管理**にし、doc/06 が最も警戒する
    「構造とスタイルの乖離」を自作することになる。インライン `css()` の「構造とスタイルが 1 本のツリーに同居」
    という利点を捨ててしまう。
  - `pageHeaderTitleDescription` 式の階層フラット命名は、避けたかった**命名コスト**そのもの。
- **コロケーション（インライン `css()`）を基本に残す**。一度きり・単一ブレークポイント・局所的な装飾はインラインのまま。
- **抽出は意味のあるまとまりに限定**: ①再利用される、②PC/スマホのペア（responsive）、③コンポーネントの「スロット」、の
  いずれか。`styles/recipe.tsx` の `button()` / `chip()` が正しい形。
- **「DOM 構造をオブジェクトとして眺めたい」願いの本命は、ネストしたスタイル木ではなく所有コンポーネント**
  （doc/06 §9.1）。構造もスタイルも 1 つのコンポーネントが所有すれば、その JSX 自体が「構造＋スタイルの同居した木」になる。

---

## 7. 確定方針（修正内容）

「わずかなバイト増は許容して可読性を取る」方針の承認を受け、ルールを次の 3 つに確定する。

### 7.1 三原則

1. **可視性** = `hideOnPc()` / `hideOnPhone()` を `styles/system.ts` に**1 組だけ**置いて共有する。
   1 ノードに 1 つだけ当て、ローカル再定義（`SidePane` の `hideOnPhone` 等）は廃止する。
2. **可視性を `display:none` で制御するなら、その下のスタイルは原則 `cssMain`（無条件）に戻す**。
   `cssPc`/`cssPh` を「スタイルの置き場所のゲート」として使うのをやめ、`focusableCard(cssPc)` / `cssFn={cssPc}` の
   **threading を撤去**する。
   - 代償: PC では使われない規則が phone 用と共有でルート CSS に載る。決定的ハッシュで共有・per-route のため
     バイト増は誤差であり、**可読性を優先して許容する**（本方針の前提）。
3. **`cssPc`/`cssPh`（= responsive）は「表示中の 1 要素の値がブレークポイントで変わる」場合だけに限定する**。
   `SidePane` の `stickyBox`（PC だけ sticky）、`Accordion` の `exprain`（クリック/タップ）がその正しい例。
   必要なら次の `responsive()` ヘルパーに畳む。

### 7.2 `responsive()` ヘルパー（要設計確定）

1 要素のブレークポイント別の値を 1 ブロックに畳み、`css()` 群を `cx` して 1 つの className を返す。
**置き場所は変えず（インラインのまま）、同じ要素の PC/SP 宣言が 1 ブロックに集まる**ことで可読性を上げるのが狙い。

```tsx
// 想定シグネチャ（確定はタスク 8 で）
const main = responsive({
    base: { flex_grow: "1", padding_top: space(8) }, // cssMain
    pc:   { padding_top: space(12) },                 // cssPc
    ph:   { /* ... */ },                              // cssPh
});
// 内部実装イメージ: cx(cssMain(base), pc && cssPc(pc), ph && cssPh(ph))
```

- 用途は「1 デザイン内の値分岐」だけ。**構造分割（別コンポーネントへ割る）とは別レイヤー**で、`responsive()` は
  構造分割には使わない。

### 7.3 意図名による可視性ヘルパー

```ts
// styles/system.ts に追加（1 組だけ）
export const hideOnPc = () => cssPc({ display: "none" });    // = スマホ専用
export const hideOnPhone = () => cssPh({ display: "none" }); // = PC 専用
```

### 7.4 構造が別物の箇所は「所有コンポーネント」を維持

`PageHeader` の `NavInline`/`NavDrawer` のように、構造が別物なら**デザインごとに別コンポーネントへ割り、内部は
メディアクエリフリー、切替はマウント地点の `hideOnPc`/`hideOnPhone` 1 行**に保つ。これは現状すでに良い形なので維持する。

---

## 8. 修正タスクリスト

> 後日、本リストに沿って実装する。各タスクは独立に近いが、T1 → T2 → (T3/T4) の順を推奨。

- [ ] **T1: `responsive()` のシグネチャ確定と実装**
  - `styles/system.ts` に `responsive({ base?, pc?, ph? })` を追加。
  - 内部は `cx(base && cssMain(base), pc && cssPc(pc), ph && cssPh(ph))`。空オブジェクト/未指定の扱いを決める。
  - 命名（`responsive` か `rcss` か）と、キー名（`base/pc/ph` か `base/pc/phone` か）を確定する。
- [ ] **T2: 可視性ヘルパー `hideOnPc` / `hideOnPhone` を `styles/system.ts` に追加**
  - `SidePane` のローカル `hideOnPhone` を削除し、共有版に置換。
  - `PostPane` のインライン `cssPc({display:none})`（L30 / L36 相当）を `hideOnPc()` に置換。
- [ ] **T3: `PostPane.tsx` の癒着分離**
  - `tocClass = cx(focusableCard(cssPh), cssPc({display:none}))` を
    `cx(focusableCard(), hideOnPc())` へ（スタイルは `cssMain`、可視性は意図名）。
  - seriesCard の className も同様に `cx(focusableCard(), hideOnPc())` へ。
- [ ] **T4: `SidePane.tsx` の癒着分離と threading 撤去**
  - `cssFn={cssPc}`（`FocusableCard` / `StackWithSeparator`）と `focusableCard(cssPh)` / `focusableCard(cssPc)` の
    threading を見直し、可視性は `hideOnPc`/`hideOnPhone`、スタイルは `cssMain` に寄せる。
  - `stickyBox`（PC だけ sticky）は responsive 用途として `responsive({ pc: {...} })` に畳む（または `cssPc` のまま残す）。
  - コンテナと中身でブレークポイントが混在している箇所（`cssPc` コンテナ内の `focusableCard(cssPh)`）を解消する。
- [ ] **T5: `PageHeader` 系の小改善**
  - `NavDrawer` の `cssPc({display:none})` 2 重記述を 1 箇所へ集約。
  - `NavInline`/`NavDrawer`/`PageHeader` の `cssPc({display:none})` / `cssPh({display:none})` を
    `hideOnPhone()` / `hideOnPc()` に置換。
- [ ] **T6: `order` / `grid-area` で代替できる二重化の洗い出し**
  - 「順番を変えるだけ」で二重 DOM になっている箇所がないか全体を点検し、あれば 1 本 DOM + 並べ替えへ。
    （アクセシビリティ: 読み上げ順が変わる場合は二重 DOM のまま）
- [ ] **T7: `cssFn` を受け取る recipe（`focusableCard` 等）の引数見直し**
  - 可視性駆動の呼び出しから `cssFn` 引数が不要になったら、デフォルトを `cssMain` にして引数を任意化、または廃止を検討。
- [ ] **T8: ドキュメント反映**
  - 方針が実装で固まったら、`05_STYLING.md` に `responsive()` / `hideOnPc` / `hideOnPhone` の節を追記し、本書の確定分を
    そちらへ昇格する。

---

## 9. まとめ

- 困りごとは「二重 DOM だから」ではなく、**(1) `order` で消せる二重化が混ざっていること**、
  **(2) 可視性とスタイル置き場が 1 式に癒着し、綴りが不揃いなこと**の 2 点。
- 置き場所論（`.css.ts` 一括 / ネストオブジェクト）は見送り、**コロケーションを基本に残す**。構造可視化は
  **所有コンポーネント**で。
- 具体策は **(a) `hideOnPc`/`hideOnPhone` で可視性を意図名・単一所有に、(b) その下のスタイルは `cssMain` に戻して
  `cssFn` threading を撤去、(c) `cssPc`/`cssPh`（responsive）は表示中の 1 要素の値分岐だけに限定**（必要なら
  `responsive()` に畳む）。
- `TocCard` / `Accordion` の内部は §7.3 を正しく実践しており**手を入れない**。修正対象は主に **mount 地点
  （`PostPane`/`SidePane`/`PageHeader`）と共有ヘルパー**に限定される。

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（島の props は `data-*`／シリアライズ制約の出どころ）
- `03_ISLAND_SYSTEM.md` — 島システム
- `05_STYLING.md` — 現行スタイリング仕様（§7.3 のスタイル収集制約）
- `06_STYLING_DIRECTION.md` — 収集方式・直交辞書・所有コンポーネントの検討記録
