import { copyFileSync } from "node:fs";
import { build } from "vite";

/**
 * GitHub Pages build.
 *
 * The repo is served from /stageplot/, so assets and app links need that base.
 * The API isn't available on Pages, so the build also flags itself as a static
 * demo (the account UI hides itself).
 */
await build({
  base: "/stageplot/",
  define: {
    "import.meta.env.VITE_STATIC_DEMO": JSON.stringify("1"),
  },
});

// SPA fallback: Pages serves 404.html for unknown paths. Booting the app there
// lets the path switch render /print, /login, etc. on a hard refresh.
copyFileSync("dist/index.html", "dist/404.html");

console.log("Pages build ready in dist/ (base /stageplot/, 404 fallback)");
