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
- UI roots call the background only through the proxy service in
  `src/extension/background-service.ts` (`@webext-core/proxy-service`); its
  types come from the implementation, so there is no separate protocol file.
  Expose only privileged or serialized work there: storage and backend data
  (e.g. a Convex client authenticated with a Better Auth token) are read
  directly by the UI, never proxied through the worker. Keep every exposed
  level wrapped in `exposed()` and validate method arguments at runtime,
  because content scripts are untrusted callers.
- User-visible strings, including manifest `name`/`description`, live in
  `locales/*.yml` and are read through `i18n.t()` from `#i18n`
  (`@wxt-dev/i18n`, typed from the default locale). Reference:
  https://wxt.dev/i18n.html
- Error reporting: only the background owns a Sentry client, configured from
  `WXT_SENTRY_DSN` with no global integrations, per Sentry's
  shared-environment guidance. Other contexts call `reportError()` from
  `src/extension/client.ts`. Never install global error handlers in content
  scripts, where they would capture the host page's errors.
- Releases go through the manual `Release` workflow (`wxt submit`, Chrome Web
  Store API v2). Bump the `package.json` version first.
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
