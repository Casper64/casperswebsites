import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig((_config) => {
  return {
    base: "./",
    root: "public",
    appType: "spa",
    resolve: {
      alias: {
        "/src": resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        input: resolve(__dirname, "./public/index.html"),
      },
      outDir: resolve(__dirname, "/dist"),
      emptyOutDir: true,
    },
    esbuild: {
      supported: {
        "top-level-await": true,
      },
    },
    server: {
      strictPort: true,
      port: 3000,
    },
    preview: {
      strictPort: true,
      port: 3000,
    },
    test: {
      include: ["test/**/*.test.ts"],
      root: ".",
    },
  };
});
