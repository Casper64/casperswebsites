import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

export default defineConfig((config) => {
  let htmlFiles: string[];

  // if (config.mode === "development") {
  //     htmlFiles = globSync("**/*.html", {
  //         cwd: resolve(__dirname, "./wwwroot"),
  //     });
  // } else {
  //     htmlFiles = globSync("wwwroot/**/*.html", {
  //         cwd: resolve(__dirname, "./"),
  //     });
  // }

  const input: any = {};
  // htmlFiles.forEach((e: string, i: number) => {
  //     input[`app_${i}`] = resolve(e);
  // });

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
  };
});
