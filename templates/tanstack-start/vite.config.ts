import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, lazyPlugins } from "vite-plus";

const ROUTER_GEN_PATH = "src/route-tree.gen.ts";
const config = defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  // TanStack Router regenerates this file with Prettier, so checking it with
  // Oxfmt would create permanent build/check drift.
  lint: { ignorePatterns: [ROUTER_GEN_PATH] },
  fmt: { ignorePatterns: [ROUTER_GEN_PATH] },
  resolve: { tsconfigPaths: true },
  plugins: lazyPlugins(() => [
    // Cloudflare must own Start's SSR environment so development and builds
    // execute against the Workers runtime: https://developers.cloudflare.com/workers/vite-plugin/reference/vite-environments/
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    devtools(),
    tailwindcss(),
    tanstackStart({
      router: {
        generatedRouteTree: "route-tree.gen.ts",
      },
    }),
    viteReact(),
  ]),
});

export default config;
