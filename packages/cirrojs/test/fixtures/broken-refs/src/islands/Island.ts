import { createIsland } from "cirrojs/server";
import islands from "./registry";

export const Island = createIsland(islands);
