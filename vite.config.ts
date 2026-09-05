import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  Date.now().toString(36);

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: null,
      includeAssets: [
        "favicon.svg",
        "icon-192.png",
        "apple-touch-icon.png",
        "assets/*.png",
        "references/*.svg",
        "references/*.jpg",
        "workers/*.js",
        "models/*.task",
        "mediapipe/wasm/*",
      ],
      manifest: {
        name: "Exploration Atlas",
        short_name: "Exploration",
        description: "一张会逐步点亮的生日活点地图。",
        theme_color: "#271b14",
        background_color: "#271b14",
        display: "standalone",
        orientation: "landscape",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/apple-touch-icon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,jpg,jpeg,png,webp,mp3,mp4,wasm,task}"],
        maximumFileSizeToCacheInBytes: 60 * 1024 * 1024,
      },
      devOptions: { enabled: true },
    }),
  ],
});
