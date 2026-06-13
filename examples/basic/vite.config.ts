import { cirro } from "cirro/vite";
import { defineConfig } from "vite";

// cirro プラグインだけで、CSP 厳格な build 設定と島マウンタが構成される。
export default defineConfig({
    plugins: [cirro({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" })],
});
