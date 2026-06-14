# クライアントスクリプトのバンドル方式 - 現状調査

本ドキュメントは、Cirro が各ページに読み込ませるクライアントスクリプト（島マウンタ）の
生成・バンドル・配信の現状を調査し、設計上の問題点を記録するものである。
調査時点のコミットに基づく（`packages/cirro` および `examples/basic`）。

## 1. 結論（要約）

- クライアントスクリプトのエントリは、サイト全体で **単一** である。
- そのエントリ（島マウンタ）は、`registry.ts` に登録された **全島を静的 import** してバンドルする。
- 生成された **同一のスクリプトを全ページが読み込む**。

すなわち「`registry.ts` を起点に全ページ共通のスクリプトを1つ生成・バンドルし、
全ページに同じものを読ませている」という理解は、現状において正確である。

## 2. 仕組みの詳細

### 2.1 単一エントリの宣言

`packages/cirro/src/vite.ts` の `config()` が、Vite のビルド入力をただ1つだけ宣言する。

```ts
rollupOptions: { input: { client: VIRTUAL_CLIENT } } // VIRTUAL_CLIENT = "virtual:cirro/client"
```

サイトにページがいくつあっても、クライアント側のエントリはこの1本のみ。

### 2.2 仮想モジュールが registry 全体を取り込む

同じく `vite.ts` の `load()` フックが、仮想モジュール `virtual:cirro/client` の中身として
島マウンタのコードを生成する。その先頭で `registry.ts`（`islands` オプションで指定したパス）を
**静的 import** している。

```ts
import { islands } from "<islandsPath>"; // 例: ./src/islands/registry.ts
// 実行時に data-island を走査し、registry から島を解決して hydrateRoot する
for (const el of document.querySelectorAll("[data-island]")) { ... }
```

`registry.ts` は全島を1つのオブジェクトに束ねているため、静的 import を通じて
**登録された全島のコードがこの単一エントリのバンドルに含まれる**。

### 2.3 全ページが同一スクリプトを参照する

`packages/cirro/src/runtime/build.ts` は、ビルド後の manifest から
`virtual:cirro/client` のエントリファイル名を **ループの外で1回だけ** 取得し、
その同じ `scriptSrc` を全ページの `<script>` に付与する。

dev（`packages/cirro/src/runtime/dev.ts`）でも、固定の `CLIENT_DEV_URL` 定数を
全ページ共通で使用する。

### 2.4 実測による裏付け（examples/basic のビルド成果物）

4ページすべてが同一ファイルを参照していることを確認した。

```
dist/index.html        : src="/assets/client-CbU2AY42.js"
dist/about/index.html  : src="/assets/client-CbU2AY42.js"
dist/posts/hello/...   : src="/assets/client-CbU2AY42.js"
dist/posts/world/...   : src="/assets/client-CbU2AY42.js"
```

## 3. 問題点

この単一エントリ・全ページ共通方式は、憲章（`01_CHARTER.md`）が掲げる
「軽量」「島が1つもないページは JS ゼロ」という目標と現状ずれている。

### 3.1 島ゼロのページにも JS が配信される（憲章違反）

`about` ページは島を1つも含まない純粋な静的ページだが、生成物には他ページと同じ
`client-CbU2AY42.js` が読み込まれている。

```
dist/about/index.html: <script async type="module" src="/assets/client-CbU2AY42.js">
```

実行時マウンタは `[data-island]` を見つけられず何もしないが、
**React ランタイムを含むスクリプト自体はダウンロードされる**。
憲章 2.1「島が1つもないページは JS ゼロで配信できること」を満たせていない。

### 3.2 ページが使わない島のコードまで配信される

全島が単一エントリに静的 import されるため、あるページが特定の島しか使わなくても、
**`registry.ts` に登録された全島のコードが1チャンクに含まれて配信される**。
（`examples/basic` は島が `counter` 1つだけなので顕在化していないが、設計上はそうなる。）
島やページが増えるほど、各ページが受け取る不要な JS が増大する。

### 3.3 影響範囲

- バイト面の「軽量」（憲章 1.3「軽量の定義」）を損なう。
- CSP 厳格性（インラインスクリプトゼロ）には影響しない。あくまで配信量・最適化の問題である。

## 4. 今後の検討方向（メモ）

本ドキュメントは現状把握と問題点の記録までを範囲とし、実装方針の決定は別途行う。
解決にあたっては、おおむね以下のような方向が考えられる。

- **ページ単位で使用する島を判定する**（ビルド時にどの島がどのページに現れるかを収集する）。
- **島があるページにのみスクリプトを挿入する**（島ゼロのページは `<script>` 自体を出力しない → JS ゼロ）。
- **必要な島だけを読み込ませる**（ページ単位エントリの生成、またはコード分割で未使用島を除外する）。

いずれの方向でも、憲章で確立した「インラインスクリプトゼロ / 厳格 CSP」の原則を
崩さないことを前提とする。
