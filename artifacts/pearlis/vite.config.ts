import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";
const isReplit = process.env.REPL_ID !== undefined;

const rawPort = process.env.PORT;
if (!rawPort && !isProduction) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort ?? "3000");
if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

const replitPlugins =
  !isProduction && isReplit
    ? [
        await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
          m.default()
        ),
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({ root: path.resolve(import.meta.dirname, "..") })
        ),
        await import("@replit/vite-plugin-dev-banner").then((m) =>
          m.devBanner()
        ),
      ]
    : [];

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss({ optimize: false }), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
    proxy: {
      "/api": {
        target: process.env.RENDER_API_URL ?? "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
