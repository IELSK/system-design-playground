import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Enables imports like "@/components/..." throughout the codebase
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Proxy: when the frontend makes a request to /api/*, Vite
    // forwards it to the backend at localhost:3333. This avoids
    // CORS issues during development and mimics what a reverse
    // proxy (nginx) would do in production.
    //
    // rewrite strips the /api prefix so the backend receives the
    // clean route (e.g. /api/health → /health).
    proxy: {
      "/api": {
        target: "http://localhost:3333",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
