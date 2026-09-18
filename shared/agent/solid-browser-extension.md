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
