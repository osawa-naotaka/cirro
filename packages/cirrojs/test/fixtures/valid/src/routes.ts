import { createRouteFn } from "cirrojs";
import { AboutPage } from "./pages/about";
import { HomePage } from "./pages/home";

export { runWithRegistry } from "cirrojs";

const { defineRoutes, route } = createRouteFn();

export default defineRoutes(
    route({ type: "static", path: "/index.html", component: HomePage }),
    route({ type: "static", path: "/about.html", component: AboutPage }),
);
