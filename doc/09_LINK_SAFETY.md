# リンク安全性の設計 - Link コンポーネント

本ドキュメントは、サイト内リンクの安全性検証（`<Link>` コンポーネントとビルド時のリンク切れチェック）の
**設計判断とその理由**を記録するものである。使い方は `04_USAGE.md` 5.6 を参照。本書は
「なぜこの形にしたのか」「何を検討して不採用にしたのか」に焦点を当てる。

関連実装: `packages/cirrojs/src/Link.tsx` / `registry.ts`・`registry.common.ts`・`registry.browser.ts`
（Store / `checkLink`）/ `runtime/link.ts`（URL ストア構築）/ `runtime/build.ts` / `runtime/dev.ts`。

---

## 1. 問題設定

静的サイトのリンク切れは、ビルドは成功するのに配信後に 404 になるという「壊れ方が遅い」不具合であり、
SSG はビルド時に全ページと全ルートを知っているのだから、ビルド時に検出できるはずである。

- **対象**: サイト内リンク（`a href`）。`img src` は別の論点（3.6 参照）があるため本書のスコープ外。
- **対象外**: 外部サイトへのリンクの死活確認（リンク先が存在するかどうか）。ネットワークアクセスを
  伴い、ビルドの決定性を壊すため扱わない。

前提となる事実: dev / build はレンダリング開始前に `expandRoutes()`（`defineRoutes` の `path` と
`getStaticPaths`）で**サイト内の全 URL を確定させている**。ただしこの列挙に `public/` は含まれない。

## 2. 設計原則

> リンクは `<Link to="...">` で宣言し、**レンダリング中に**、レンダリングと同じコンテキスト
> （AsyncLocalStorage の Store）で全 URL 集合と照合する。dev は警告、build はエラーとする。

- 既存の CSS レジストリ（`runWithRegistry` / ALS の Store）と同じレールに乗せる。レンダリング 1 回分の
  状態を ALS で持ち回るパターンは確立済みであり、新しい仕組みを持ち込まない。
- チェックされるのは**実際にレンダリングされたリンクだけ**である。デッドコード中のリンクで偽陽性を
  出さない。
- 検証は opt-in である。素の `<a>` はチェックされない。強制ではなく「Link を使えば守られる」という契約。

## 3. 検討して不採用にした案

### 3.1 型による静的チェック（見送り・一部先取り）

全パスを抽出して型定義ファイルを生成し、`to` をリテラルユニオン型で検査する案。動的ルートの URL は
`getStaticPaths()`（コンテンツ層に依存し得る）を実行しないと確定しないため、「ビルドしないと型が
確定しない」という鶏卵問題を抱える。コード生成の仕組みも必要になり、手間に対して見合わない。

`to` をテンプレートリテラル型 `` `/${string}` `` にして「ルート相対パスであること」だけ型レベルで
先取りする案も実装時に検討したが、ページ内アンカー（`to="#top"`。目次からのジャンプ等で実需がある）が
書けなくなるため採用せず、`to: string` としてランタイム検証（4.2）に一本化した。
`` `/${string}` | `#${string}` `` のユニオン型は将来候補である（6 章）。

### 3.2 post-build スキャン（不採用）

生成後の `dist/*.html` を走査して全 href を検証する案。Link を使わないリンクも Markdown 内リンクも
漏れなく検証できる、保証としては最も強い方式である。しかし:

- HTML パーサへの依存が増える。
- エラーとソース位置（どの JSX / どの Markdown か）の対応が悪い。
- Cirro は TypeScript + Node + Vite の範囲で完結し、利用者に仕組みが見える程度の薄さを保つ方針で
  ある。生成物を事後に走査する方式は利用者から「魔法」に見える。

### 3.3 `newWindow` 等の独自 prop（不採用）

`target="_blank"` を `<Link newWindow />` のような独自 prop に包む案。不要と判断した。

- `target="_blank"` の脅威（タブナビング: 開いた先が `window.opener` 経由で元ページを遷移させる）は、
  ①モダンブラウザは `target="_blank"` に暗黙で `noopener` を適用する、②この Link は**サイト内リンク
  専用**であり開く先は自分のサイト＝自分のコードである、という二重の理由で成立しない。
- 独自 prop は HTML の語彙に対する学習コストの追加である。「React の知識だけで書ける」
  （`01_CHARTER.md`）に従い、`target` を含む `<a>` の標準属性をそのまま通す。

### 3.4 href の正規化 emit（不採用）

`to="/about.html"` と書かれたとき、出力する href をクリーン URL（`/about`）に書き換える案。
**ユーザーが書いたものを背後で変更しない**方針を優先し、as-written で出力する。

これが安全である根拠: 照合を通る書き方（4.4 の正規化リスト）は**すべてそのまま配信可能な URL**
である。`/about.html` は直接配信され、`/path/to/` も `/path/to` もディレクトリインデックスとして
解決する。唯一ホスト依存で 404 になり得る `/path/about/` は照合で弾く。したがって as-written で
emit しても、チェックを通過したリンクが切れる経路は存在しない。コストは、ホスト側がクリーン URL に
正規化する場合にリダイレクトを 1 回挟み得ることだけであり、許容する。

副次効果として、出力用の正規化が不要になり、正規化関数は照合専用の 1 個で済む。

### 3.5 `new Error()` のスタックトレースによる帰属（不採用）

不正リンクの発生源を特定するために `checkLink()` 内で `new Error().stack` を取る案。**動作しない**。
JSX の子は親コンポーネントが要素ツリー（データ）を return した**後**に React が呼ぶため、`Link()`
実行時のコールスタックに親コンポーネントのフレームは存在せず、react-dom/server の内部フレームしか
写らない。なお jsx-dev-runtime の `_source`（ファイル名・行番号）は React 19 で削除済み。

代わりに**ページ単位の帰属**を採用する（4.5 参照）。build ループはページを 1 つずつ処理しており、
「どの出力ページのレンダリング中か」はランタイム側でタダで付けられる。コンポーネント単位の特定が
必要なら React 19.1 の `captureOwnerStack()`（development ビルド専用、production では null）を
dev 向けに上乗せできる（6 章）。

### 3.6 img src の同時対応（ペンディング）

`img src` にも同種の検証が欲しいが、`public/` の画像への参照検証にとどまらず、「`src/` 内の画像を
取り込んで `dist/` へコピーする `<Img>` コンポーネント」という機能拡張の構想と絡む。ファイルコピーは
Cirro の範疇を超える可能性があり、別途検討する。ただし URL ストアに public 由来の層を持たせる設計
（4.3）は img src 検証の先行投資になっている。

→ 検討の結果を `10_IMAGE_ASSETS.md` に設計として記録した（`<Image>` / `<FaImg>`）。

## 4. 採用した設計

### 4.1 Link の API

`<a>` の薄いラッパーとし、独自 prop は `to` のみ。標準属性（`className` / `id` / `aria-*` /
`data-*` / `target` / `rel` / `download` 等）は素通しする。

```tsx
export type LinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
    to: string;
};

export function Link({ to, children, ...rest }: LinkProps): ReactNode {
    checkLink(to);
    return (
        <a {...rest} href={to}>
            {children}
        </a>
    );
}
```

- **`href` は型から除外し `to` に一本化する**。検証を通らない入口を型で塞ぐのが Link の存在意義。
  `{...rest}` を先に展開し `href` を後置することで、型を無視した JS 利用者が `href` を混ぜても
  上書きされない。
- **`to` の型は `string`**。ページ内アンカー（`#top`）を許容するためで、形式の検査はランタイム
  検証（4.2）が担う（3.1 参照）。
- **href は as-written で emit する**（3.4 参照）。

### 4.2 `to` のランタイム検証

型では表現できない検証を `checkLink()` で行う。判定は次の順序で、違反は throw せず Store へ収集する
（4.5 参照）。

1. 全体を `decodeURIComponent` に通す。失敗（不正な % シーケンス）は **malformed**。
2. デコード結果が `//` または `/\` で始まるものは **malformed**。`//evil.com/...` は `/` で始まるが
   **プロトコル相対 URL として外部サイトに飛ぶ**（ブラウザ互換の癖で `/\evil.com` も同様）。
   「ルート相対のみ許容」の唯一の抜け穴であり、必ず塞ぐ。
3. `/` 始まりでも `#` 始まりでもないものは **malformed**（相対パス・外部 URL は受け付けない）。
4. `#` 始まり（ページ内アンカー）は存在チェックの対象外として許容する。
5. `/` 始まりは fragment・クエリ文字列を除去したうえで URL ストア（4.3）と照合し、
   存在しなければ **not-found**。

`javascript:` 等の危険スキームは「`/` か `#` 始まりのみ許容」の時点で排除されている。

### 4.3 URL ストア: ルート由来 + public 由来の 2 層

`collectSiteLinks()`（`runtime/link.ts`）が dev / build のレンダリング前に URL の Set を構築し、
`runWithRegistry()` の第 3 引数として Store に渡す。Set は 2 層からなる。

1. **ルート由来**: `expandRoutes()` が展開した全 URL（静的・動的・ファイルルート）。ランタイムが
   CSS 配信用に生成するエントリ（`type: "css"`、`/about.html.css` 等）は利用者がリンクを張る対象では
   ないため除外する。
2. **public 由来**: Vite の `config.publicDir`（カスタム設定と `false` による無効化に追従する）配下を
   再帰的に列挙した**ファイル**。ディレクトリ自体は登録しない（ディレクトリ名へのリンクは配信され
   ないため）。publicDir が存在しないサイトではこの層をスキップする。これがないと public に置いた
   PDF や画像への Link が偽陽性になる。

build は Set を 1 回構築して全ページで使い回す。dev は html リクエストのたびに構築する（ルートも
public もリクエスト間で変わり得るため。個人サイト規模では列挙コストは無視できる）。

### 4.4 綴りの吸収は Set 構築側で行う

設計議論の段階では「正規化関数 1 個を Set 構築側と照合側で共有する」形を想定していたが、照合側
単独では成立しないことが実装時に判明した。`/path/to/`（許容）と `/path/about/`（拒否）は文字列と
してはどちらも「末尾スラッシュ」であり、区別はリンク先がディレクトリインデックス由来かどうか、
つまり **Set を構築する側だけが持つ情報**に依存するためである。

そこで「照合側で正規形に潰す」のではなく、**Set 構築側で配信可能な綴りをすべて展開して登録する**
（`runtime/link.ts` の `collectLinks`）。照合側の処理は fragment・クエリの除去と
`decodeURIComponent` だけに縮む（4.2 参照）。

ルート定義の `path` は html ファイルの exact な名前（例: `/about.html`）を返すことを前提に:

| ルート定義の path | Set に登録される綴り |
| --- | --- |
| `/path/to/index.html` | `/path/to/index.html`・`/path/to/`・`/path/to` |
| `/index.html` | `/index.html`・`/`（ルートの特例） |
| `/path/about.html` | `/path/about.html`・`/path/about` |
| `/search-index.json` 等 | そのまま（拡張子ごと照合） |

- `/path/about/` はどの展開でも登録されないため、**「単に Set に存在しない」ことで自然に弾かれる**
  （ホスト依存で 404 になり得る形）。
- 登録される綴りはすべてそのまま配信可能な URL なので、as-written で emit しても（3.4）チェックを
  通過したリンクが切れる経路は存在しない。
- `.htm` も `.html` と同様に扱う（dev サーバーの URL 解決と整合）。
- Set 構築側も登録時に `decodeURIComponent` を通す。日本語 slug 等で、`to` に生の文字列と
  % エンコード済みのどちらが来ても照合できるようにするためで、不正な % シーケンスは警告して
  スキップする（照合側では malformed として収集）。

### 4.5 違反の収集と報告: throw せず、集めて、まとめて出す

`checkLink()` はレンダリング中に throw **しない**。違反を `BrokenLink`
（`{ type: "not-found" | "malformed"; link: string }`）として Store に積むだけとし、warn / error の
判断はランタイム側に置く。`runWithRegistry()` の戻り値に `brokenLinks` として返る。

- **dev**: レンダリング完了後、コンソールに警告を出す（執筆中のフローを止めない）。
- **build**: 全ページ処理後に、**どの出力ページからのリンクか（ページの path）を付けて**全違反を
  まとめて報告し、`process.exitCode = 1` で終了する（成果物の書き出し自体は行う。CI はここで止まる）。

throw しない理由:

- render 中の throw は最初の 1 件でビルドが止まり、修正→再ビルドのループを強いる。全件を一度に
  報告する方が直しやすい。
- render 中の throw は React の内部フレームに包まれ、トレースが読みにくい。
- 「レンダリング中は積むだけ、処理はレンダリング後」は CSS レジストリ・`styleSample()` と同じ
  既存パターンであり、責務の置き場所が一貫する。

報告例（build）:

```
Warning: broken links in "/about.html": "/aboot" (not-found), "//evil.example.com" (malformed)
```

発生源はページ単位で特定できれば実用上十分である（`to="/aboot"` を grep すれば到達できる）。
なお `new Error().stack` によるコンポーネント単位の特定は不可能である（3.5 参照）。

### 4.6 browser 側は no-op

島（クライアント）内で Link が使われた場合、ALS の Store は存在しない。`registry.browser.ts` と
同じレールで、browser 向けの `checkLink()` は no-op とする。これがないと島内の Link が
「outside of render context」で落ちる。島内のリンクは初期 HTML の SSR 時に検証される場合を除き
チェック対象外となるが、許容する。

## 5. 制約と非目標

- **素の `<a href>` は検証しない**。Link を使うことによる opt-in の検証である（強制しない）。
- **Markdown 本文中のリンクは検証される**（2026-07 実装）。本書と同じ `checkLink` の分類を
  markdown パイプラインの信頼済み層から呼ぶ。設計は `13_MARKDOWN_REF_CHECK.md`、使い方は
  `04_USAGE.md` 7.5 を参照。
- **外部リンクの死活確認はしない**（1 章）。
- **fragment の存在検証はしない**。`/about#section` の `#section` が見出し id として存在するかは
  照合しない（toc が id を生成しているため将来は可能だが、スコープ外）。
- **リンクの書き方は利用者の責任**。Cirro は href を書き換えない。ホストのクリーン URL 正規化で
  リダイレクトを避けたい利用者は、最初からクリーン URL で書けばよい（ドキュメントに明記する）。

## 6. 将来の拡張候補

いずれも「同じ Store・同じ正規化関数に乗せる」前提を守れば後方互換に追加できる。

- ~~**Markdown 内リンクの検証**~~: **実装済み**（`13_MARKDOWN_REF_CHECK.md`）。
- **`aria-current="page"` の自動付与**: Store が現在レンダリング中のページ path を持つため、
  `to` の正規形が現在ページと一致したら自動で付与できる。ナビの現在地表示が JS ゼロで正しくなる、
  ビルド時に決定できる SSG ならではの機能。
- **dev でのコンポーネント単位の帰属**: React 19.1 の `captureOwnerStack()` を `checkLink()` で
  呼び、オーナースタックを Store に併記する。development ビルド専用（production では null）なので
  `captureOwnerStack?.() ?? null` として安全に足す。
- **`img src` の検証 / `<Img>` コンポーネント**（3.6 参照）。
- **`to` の型強化**: `` `/${string}` | `#${string}` `` のテンプレートリテラル・ユニオンにすれば、
  ルート相対とページ内アンカー以外をコンパイル時に弾ける（3.1 参照）。さらに先の候補として、
  静的ルートに限定したリテラル型化。

## 付録

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（セキュリティファースト・「React の知識だけで」の出典）
- `04_USAGE.md` — 利用ガイド（5.1 ルーティング / 8 章 dev・build の仕組み）
- `05_STYLING.md` — CSS レジストリ（`runWithRegistry` / ALS の Store という既存レール）
- `08_CONTENT_LAYER.md` — コンテンツ層（`getStaticPaths` と全 URL 列挙の関係）
