import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Figma code-layer-safe config.
// - base "./" → relative asset URLs, so dist/ works wherever Figma serves it from.
// - server.host/port read $PORT, which Figma's .figma/make/dev sets.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: Boolean(process.env.PORT),
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
  },
  build: { outDir: "dist", sourcemap: false },
});
