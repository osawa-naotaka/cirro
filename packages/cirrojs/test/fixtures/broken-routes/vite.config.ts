import react from "@vitejs/plugin-react";
import { cirro } from "cirrojs/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), cirro({ routes: "./src/routes.ts" })],
});
