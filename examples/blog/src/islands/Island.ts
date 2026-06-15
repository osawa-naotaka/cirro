import { createIsland } from "cirrojs";
import { islands } from "./registry";

// 純データの registry から型安全な <Island> を生成する（renderToString はこちら側＝サーバー専用）。
export const Island = createIsland(islands);
