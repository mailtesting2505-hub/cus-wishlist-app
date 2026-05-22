// web/frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.SHOPIFY_API_KEY": JSON.stringify(process.env.SHOPIFY_API_KEY),
  },
  server: {
    port: parseInt(process.env.FRONTEND_PORT) || 3001,
    proxy: {
      "^/api": {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || 3000}`,
        changeOrigin: true,
      },
    },
  },
});
