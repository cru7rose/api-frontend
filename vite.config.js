/**
 * ARCHITECTURE: Vite config sets alias and dev proxy to avoid CORS during local development.
 * Responsibilities:
 * - Proxy /auth, /api, /status to VITE_PROXY_TARGET so the browser stays same-origin (localhost:5173).
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

const target = process.env.VITE_PROXY_TARGET || "https://api.danxils.com";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // authenticate and session endpoints
      "/auth": {
        target,
        changeOrigin: true,
        secure: true,
      },
      // application APIs
      "/api": {
        target,
        changeOrigin: true,
        secure: true,
      },
      // health/provider checks
      "/status": {
        target,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
