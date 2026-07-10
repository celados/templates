import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

const config = defineConfig({
  // TanStack Router regenerates this file with Prettier, so checking it with
  // Oxfmt would create permanent build/check drift.
  lint: { ignorePatterns: ["src/routeTree.gen.ts"] },
  fmt: { ignorePatterns: ["src/routeTree.gen.ts"] },
  resolve: { tsconfigPaths: true },
  plugins: lazyPlugins(() => [devtools(), tailwindcss(), tanstackStart(), viteReact()]),
});

export default config;
