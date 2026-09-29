import react from "@vitejs/plugin-react";
import { cirro } from "cirrojs/vite";
import { defineConfig } from "vite";

// islands をあえて設定しない: <Island> を描画しても何もハイドレートしない状態を作る。
export default defineConfig({
    plugins: [react(), cirro({ routes: "./src/routes.ts" })],
});
