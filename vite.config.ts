import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/system-mark.svg"],
      manifest: {
        name: "The System: Life OS",
        short_name: "Life OS",
        description: "A local-first personal transformation operating system.",
        theme_color: "#05070d",
        background_color: "#05070d",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/system-mark.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("echarts")) return "charts";
          if (id.includes("react") || id.includes("react-dom")) return "react-vendor";
          if (id.includes("@tanstack")) return "router-vendor";
          if (id.includes("dexie")) return "storage-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
        }
      }
    }
  }
});
