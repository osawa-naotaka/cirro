# ビルド失敗系テストのフィクスチャ

`test/build-failure.test.ts` が `cirro build` を実際に走らせる対象。examples と違って
**意図的に壊してある**ため、`examples/` ではなくここに置く（利用者向けの雛形と混ざらないように）。

- `valid/` — 違反ゼロ。空振り防止の対照群（終了コード 0 になることを確認する）
- `broken-refs/` — 描画中に収集される違反（リンク・画像・島・site・Markdown 参照）
- `broken-routes/` — ルート展開後に検出される違反（重複・パス形式・public 衝突）

依存パッケージ（react / vite / @vitejs/plugin-react）は親の `packages/cirrojs/node_modules`
から解決され、`cirrojs` 自身は package.json の自己参照（self-reference）で解決される。
そのため各フィクスチャに package.json は置かず、`pnpm install` の追加も不要にしている。
