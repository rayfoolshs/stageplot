import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the Fastify server during dev.
      "/api": "http://127.0.0.1:3001",
    },
  },
  optimizeDeps: {
    // Shared package is consumed as TypeScript source.
    exclude: ["@stageplot/shared"],
  },
});
