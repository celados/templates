import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["shared/**", "templates/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  fmt: {
    ignorePatterns: ["shared/**", "templates/**"],
  },
});
