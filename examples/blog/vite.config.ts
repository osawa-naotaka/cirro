import react from "@vitejs/plugin-react";
import { cirro } from "cirro/vite";
import { defineConfig } from "vite";

// React プラグインは利用者が明示的に追加する（cirro は内包しない）。
export default defineConfig({
    plugins: [react(), cirro({ routes: "./src/routes.ts", islands: "./src/islands/registry.ts" })],
});
