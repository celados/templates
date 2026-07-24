import { defineConfig } from "vite-plus";

// Scratch and trash hold foreign or disposable trees; template sources are checked by
// their own standalone configs so root policy does not reinterpret framework files.
const ignoredPaths = [".scratch/**", ".trash/**", "shared/**", "templates/**"];

export default defineConfig({
  lint: {
    ignorePatterns: ignoredPaths,
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
    ignorePatterns: ignoredPaths,
  },
});
