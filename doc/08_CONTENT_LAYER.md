# コンテンツ層の設計 - defineContent

本ドキュメントは、Cirro のコンテンツ層（`defineContent` / `createRouteFn` / `PageProps`）の
**設計判断とその理由**を記録するものである。使い方は `04_USAGE.md` 5.5 を参照。本書は「なぜこの形に
したのか」「何を検討して不採用にしたのか」に焦点を当てる。

関連実装: `packages/cirrojs/src/content.ts` / `route.ts` / `router.ts` / `runtime/dev.ts` / `runtime/build.ts`。
利用例: `examples/blog/src/content.ts` / `routes.ts` / `pages/*.tsx`。

---

## 1. 問題設定

Cirro はコンテンツの保存先や形式を規定しない。保存先や内容は多様であり、そのすべてをサポートすることは
できないため、コンテンツの取得はサイト側の責任とする方針である（例: `import.meta.glob` で Markdown を
読む）。ただし、この方針だけでは次の問題が残る。

- **非同期取得の行き場がない**。ページの描画は `renderToStaticMarkup` による**同期処理**であり、
  コンポーネント内で `await` できない。DB・ヘッドレス CMS・ネットワーク越しの取得（すべて async）を
  行う場所が構造上存在しなかった。
- **グローバルなモジュール状態への密結合**。コンテンツを「モジュールスコープの `export const posts`」
  として持つと、全 import 箇所がその同期的な存在を前提にする。取得元をネットワークに変えた瞬間に
  全利用箇所が壊れ、テストでの差し替えも難しい。

なお、Cirro の対象は小規模サイトであるため、**起動時に全コンテンツを無条件で取得してよい**と割り切る。
ページごとの逐次クエリ（インクリメンタルな取得）はスコープ外とする。

## 2. 設計原則: 取得（非同期）と描画（同期）の分離

結論として採用した原則は次の 1 行に要約される。

> データ取得は async な `loader` としてレンダリングの**前**に一度だけ実行し、
> 描画は同期のまま、取得結果を props として受け取る。

これは `01_CHARTER.md` の「データ取得は、HTML 化の前にビルドスクリプト側で行う」という当初方針を、
利用者に開かれた API として具体化したものである。

もう 1 つの重要な結論は、コンテンツ層の役割の定義である。

> コンテンツ層とは「取得の仕組み」ではなく、**出自の異なるデータが型付きで合流する場所**である。

loader が返すものがコンテンツのすべてであり、glob で読んだ Markdown、フェッチ結果、手書きの
JavaScript オブジェクト（著者一覧・サイト設定など）を 1 つのストアに合成してよい。保存先や形式に
依存しない共通の管理点はここに集約される。

## 3. 検討して不採用にした案

### 3.1 async ページコンポーネント（不採用）

ルートのトップコンポーネントを async にし、中で `await` できるようにする案。

- async コンポーネントが正式に動くのは RSC の世界だけであり、`renderToStaticMarkup` は同期 API である。
  Cirro が手動でトップだけ `await component(props)` することは可能だが、**「トップは await できるが
  子コンポーネントはできない」という非対称な API** になる。
- この非対称性を利用者に説明するコストが高く、RSC との違いの説明を常に強いられる。
- 取得と描画を分離すれば async コンポーネントの必要性自体が消える。

### 3.2 トップレベル await（TLA）のみで済ませる（不採用）

Vite の SSR モジュール評価は TLA に対応しているため、`export const posts = await fetchPosts()` と
書くだけでも動く。何も API を追加しない選択肢もあったが、次の理由で専用 API を設けた。

- **再フェッチの制御ができない**: dev の full-reload でモジュールが再評価されるたびに取得が走る。
- **失敗の見え方が悪い**: fetch の失敗が「モジュール評価エラー」として現れ、原因の文脈が失われる。
- **実行タイミングが暗黙**: いつ・どの順で取得が走るかが import グラフに依存し、制御できない。

つまり `defineContent` の存在価値は **「TLA + ライフサイクル管理」** である。使用感（import すると
解決済みに見える）は保ちつつ、取得の実行タイミング・キャッシュ・エラー報告をランタイムの管理下に置く。

### 3.3 コンフィグにコンテンツファイルのパスを渡す（試作の後、廃止）

試作段階では `cirro({ contents: "./src/content.ts" })` のように Vite プラグインのオプションで
パスを渡し、ランタイムが動的 import する形をとった。動作はするが、次の欠陥があり廃止した。

- **コンフィグのパスと型の由来を繋ぐものが何もない**。routes.ts は型のためにコンテンツモジュールを
  import するが、コンフィグが別のファイルを指していても型は黙って嘘をつく。
- 設定項目が 1 つ増える。

代わりに、`defineRoutes()` の戻り値（default export）に**コンテンツハンドルを同梱**する形にした
（4.2 参照）。ランタイムは routes モジュールだけを見ればよく、型とランタイムの同一性が構造的に保証される。

### 3.4 スキーマ検証の同梱（不採用・受け口のみ将来検討）

frontmatter や API レスポンスの検証（zod / valibot 等）は有用だが、**Cirro はバリデータを同梱・選定
しない**。検証はサイト側が loader 内で行えばよい。将来サポートするなら、特定ライブラリに依存しない
**Standard Schema** を受け口にする（valibot / zod / arktype が共通実装している仕様）。

また「未検証データの型ブランド化」も見送った。ブランド型が機能するのは**消費地点を握っている場合**
（例: `renderMarkdown` が受け取るサニタイズ済み HTML）だけであり、コンテンツのメタデータの消費地点は
利用者の JSX なので介入できない。脅威モデル上も、React のテキストエスケープと `script-src 'self'`
（`javascript:` URL の実行も塞ぐ）が既に防衛線であり、メタデータ検証の価値はセキュリティよりも
「ビルド時の正しさと壊れ方の分かりやすさ」にある。

## 4. 採用した設計

### 4.1 API の全体像

```ts
// src/content.ts — 取得（非同期）
export const content = defineContent({
    loader: async () => {
        const posts = await loadMarkdownPosts(); // glob でもフェッチでもよい
        return { posts, site: { title: "..." } }; // 手書きオブジェクトの合成も自由
    },
});

// src/routes.ts — 配線と型の接続
const { defineRoutes, route } = createRouteFn(content);
export default defineRoutes(
    route({
        type: "dynamic",
        path: ({ slug }) => `/blog/${slug}.html`,
        getStaticPaths: (content) => content.posts.map(({ slug }) => ({ slug })),
        component: PostPage,
    }),
);

// src/pages/post.tsx — 描画（同期）
export function PostPage(props: PageProps<typeof content, { slug: string }>) { ... }
```

- `defineContent({ loader })` … async loader を包んだハンドルを返す。
- `createRouteFn(content)` … ハンドルを受け取り、`content` の型 `T` が束縛された
  `defineRoutes` / `route` を返す。引数省略時は `T = undefined`（コンテンツ層を使わないサイト）。
- `PageProps<H, P>` … ページコンポーネントの props 契約（`{ params: P; content: ContentType<H> }`）。
- `getStaticPaths` は `content` を引数に受け取る。**全 URL の列挙とページ本文は同じデータ由来**
  であることが多く、取得結果を共有できる必要があるため。

### 4.2 配線: ランタイムと型は別チャネル

`createRouteFn(content)` に渡された値は、`defineRoutes()` の戻り値
`{ content, routes }` に同梱されて default export される。

- **ランタイム配線**: dev / build は routes モジュールの default export から `content.loader` を
  取得して await する。コンフィグに追加の設定項目は不要。
- **型配線**: routes.ts / 各ページが content.ts を通常の import で参照することで型が流れる。
  `createIsland(islands)` と同じ「値を型の運び屋にする」ファクトリパターンであり、ランタイムの
  動的 import に型が付かないことは問題にならない。

コンポーネント関数の props は反変で検査されるため、**content を使わないページは props から
単に省略でき、間違った content 型を宣言したページは型エラーになる**。強制と自由のバランスが
型システムから自然に得られる。

### 4.3 dev ランタイム: Promise キャッシュ

dev サーバーは loader の**戻り値ではなく Promise をキャッシュ**する（`contentPromise ??= loader()`）。

- 値のキャッシュ + 番兵（`null` チェック）だと、loader が正当に null を返すケースと、同時リクエストで
  loader が二重実行されるケースに穴がある。Promise 自体を持てば「実行中」もキャッシュとして機能し、
  両方が一度に解決する。
- Promise は一度 settle したら状態が変わらないため、何度 await しても同じ結果が返る（再実行されない）。

キャッシュの無効化は watcher と連動する。`watchDir` 配下のファイルの **change / add / unlink** で
`contentPromise = null` にして full-reload を送り、次のリクエストで再取得する。追加・削除も対象に
するのは、`import.meta.glob` で読むコンテンツはファイル集合の変化で結果が変わるため。なお追加された
ファイルはモジュールグラフに未登録であり Cirro 側の無効化は届かないが、glob importer の無効化は
Vite 本体が add / unlink 時に行う（`getAffectedGlobModules`）。Cirro が担うのはコンテンツキャッシュの
破棄と full-reload である。

既知の制限: loader が reject した場合、その Promise がキャッシュに残るため、ファイル変更で
無効化されるまで同じエラーが返り続ける。一時的な外部要因（DB の瞬断等）から自動回復したければ、
失敗時に `contentPromise` をリセットして次のリクエストで再試行する改良が将来候補である。

### 4.4 build ランタイム

`vite build` 後の静的化フェーズで、routes 評価 → `content.loader()` を 1 回 await →
`expandRoutes(routes, content)` の順に実行する。dev のようなキャッシュは不要（1 回きりのため）。
routes / content の形状はどちらのランタイムでも検証し、loader 忘れ等は文脈付きのエラーで報告する。

## 5. 制約と非目標

- **コンテンツはビルド時（SSR）専用**。島（クライアント）から `content` は参照できない。島に渡したい
  データは `<Island>` の props として明示的に渡す。これは「本文のデータをクライアントに送らない」という
  Cirro の軽量性の原則とも一致する。
- **逐次取得はしない**。起動時の全件取得で成立する規模のサイトが対象。ページごとのクエリ発行が必要な
  規模になったら、それは Cirro のスコープ外である。
- **バリデータ・CMS クライアント等は同梱しない**。loader の中身は完全にサイト側の自由。

## 6. 将来の拡張候補

いずれも現時点では不要と判断したが、必要になったとき後方互換に追加できる形になっている。

- **loader 失敗時の自動再試行**（4.3 の既知の制限）。
- **Standard Schema 受け口**: `defineContent({ loader, schema })` でロード時に検証し、
  エントリ単位の分かりやすいビルドエラーを出す（3.4 参照）。
- **ルート単位のセレクタ**: `route()` に `load: (content, params) => data` を追加し、ページへ渡す
  データを最小化する。全部入り注入で始めても、後から足せる。
- **コレクション用クエリヘルパー**: ソート・タグ集計・ページネーション（`getStaticPaths` 直結）など、
  コンテンツの中身に依存しない定型操作の提供。

## 付録

### 関連ドキュメント

- `01_CHARTER.md` — プロジェクト憲章（「データ取得は HTML 化の前に」の出典）
- `04_USAGE.md` — 利用ガイド（5.5 にコンテンツ層の使い方）
- `03_ISLAND_SYSTEM.md` — 島システム（コンテンツがクライアントに渡らない理由の背景）
