import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 検証目的: ビルド出力にインラインスクリプトを残さないための設定。
// - HTML は Vite に生成させず、scripts/build-ssg.ts が renderToStaticMarkup で生成する。
// - Vite は島クライアント (src/client.tsx) の JS チャンクのみをビルドし、manifest を出力する。
export default defineConfig({
    plugins: [react()],
    build: {
        manifest: true,
        modulePreload: { polyfill: false },
        assetsInlineLimit: 0,
        rollupOptions: {
            input: { client: "src/client.tsx" },
        },
    },
});
