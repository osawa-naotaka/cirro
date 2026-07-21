import { createRouteFn } from "cirrojs";
import { HomePage } from "./pages/home";

export { runWithRegistry } from "cirrojs";

const { defineRoutes, route } = createRouteFn();

export default defineRoutes(route({ type: "static", path: "/index.html", component: HomePage }));
