<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

After completing a meaningful development stage, if the project defines
`deploy:temporary`, use it when an online preview would help verify or share the
result. Return the deployment URL and the time-sensitive Cloudflare claim URL
to the user.

<!--VITE PLUS END-->

## Solid browser extension contract

- Before changing WXT configuration, entrypoints, storage, messaging, or browser
  lifecycle behavior, read https://wxt.dev/llms.txt and the relevant linked
  official browser-extension documentation.
- Manifest V3 is the default. Treat the background service worker as ephemeral:
  persist durable state in extension storage and keep message handlers safe
  across worker restarts.
- Keep permissions and host matches at the narrowest feature-required scope.
  Do not add a fixed extension key, broad host permission, remote executable
  code, or a main-world content script without a concrete requirement.
- Content-script UI uses a Shadow Root with event isolation. Preserve explicit
  mount and disposal behavior, use the WXT context lifecycle helpers, and avoid
  `rem` units because the host page controls the root font size.
- Keep cross-context communication behind the typed protocol in
  `src/extension/`. Validate messages at runtime because webpage and extension
  boundaries are not trustworthy TypeScript callers.
- System Google Chrome no longer accepts command-line extension sideloading.
  Do not download Playwright Chromium as a fallback. Use the repository Chrome
  launcher, which loads the unpacked output through the official experimental
  `Extensions.loadUnpacked` CDP command, and connect E2E automation through the
  same endpoint.
- UI is Solid 2, client-only: `@solidjs/vite-plugin` without start mode runs
  inside WXT's Vite build. Solid 2 is not Solid 1 and not React; read
  `node_modules/solid-js/CHEATSHEET.md` before editing components, and use the
  `solid-migration` skill for state design. Solid packages are pinned to exact
  pre-release versions that share one runtime; upgrade them together.
- Extension storage is the authority for shared state. UI roots read it as a
  Solid async source (`src/extension/counter-source.ts`) and send mutations to
  the background through `action`s; they do not keep a second local copy.
