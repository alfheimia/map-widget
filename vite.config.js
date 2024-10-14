import { defineConfig } from "vite";

export default defineConfig({
  // Basic configuration
  root: "./",
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
