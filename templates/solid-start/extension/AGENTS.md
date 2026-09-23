# Companion browser extension

A Manifest V3 extension for the same product as `web/`, sharing its Convex
backend. It has its own `package.json` so WXT keeps its own Vite resolution
instead of the root's Vite+ core override; lint and format policy still come
from the root `vite.config.ts`. Run its scripts through the root
`extension:*` aliases or `bun run --cwd extension <script>`.

Dependencies point one way: `extension/` may import `convex/_generated`,
`web/src/lib/`, and the tokens and reset in `web/src/styles/`; `web/` and
`convex/` never import `extension/`. `convex` is
deliberately not in this `package.json`: imports resolve to the root copy, so
`ConvexClient` has one declaration. Solid is in both; keep the exact pins
equal, since `web/src/lib/convex.ts` is bundled here against this copy.

## Removing the extension

A project that does not ship an extension deletes, in one change:

1. `extension/`
2. `.github/workflows/extension-release.yml`
3. the root `package.json` `postinstall` and `extension:*` scripts, and the
   `extension:*` steps in `check` and `build`
4. `extensionGenerated` in the root `vite.config.ts`
5. `WXT_SITE_URL` in the root `.env.example`, the extension section of the
   root `AGENTS.md` and `README.md`, the "shared with `extension/`" clause of
   its Styling bullet, and the extension sections of `docs/glaze-and-ark.md`

## Convex and auth

- Extension pages (side panel, popup, options) read Convex directly: one
  client per page from `createBackend()` in `src/backend/convex.ts`, live
  queries through `createPersistedQuery` (or `createQuery` from
  `web/src/lib/convex.ts` when a stored first paint is not wanted), and
  mutations through `backend.client.mutation`. The background never proxies
  queries or caches product data; a proxy re-implements subscriptions,
  reconnects, and consistency by hand.
- The extension holds no credentials. `src/backend/session.ts` mints a Convex
  JWT from the web app's Better Auth session cookie (`GET
/api/auth/convex/token`, which Better Auth does not origin-check), so people
  sign in and out on the web app. A change to that cookie re-arms `setAuth` in
  every open page and aborts the previous fetcher; a removal first calls
  `client.client.clearAuth()`, because Convex drops the unauthenticate that a
  re-arm sends while the socket is paused, as `web/src/lib/auth.ts` does on
  sign-out. A refresh overwrite is not a sign-out. Only a 401 means signed
  out; other failures retry, and are reported once when online. The only host permission is the web app's host, without a
  port, because the cookies API checks access against port-less cookie URLs.
- Content scripts never hold a Convex client or token: they run in the host
  page's renderer and fetch with its origin. Product data they need goes
  through a background procedure that mints a token the same way and uses a
  one-shot `ConvexHttpClient`, holding no subscription or cache.
- Stored answers (`src/backend/snapshots.ts`, the page's `localStorage`) are
  provisional first paint, never authority: do not gate behavior on them, and
  write them only from live answers. They belong to the user the live
  `currentUser` confirmed, and a different user, a sign-out, or a new extension
  version drops them. Known boundary: until the socket confirms, the stored
  user is shown, e.g. after signing out on the web app while the extension was
  closed; offline, that lasts until the network returns.
- Create sources above the `<Loading>` that reads them; the arguments of a
  persisted query must not read a pending source, since its snapshot is looked
  up from the initial arguments. Give each auth-gated query its own `<Errored>`
  inside the signed-in branch, so its failure stays local and a sign-out
  replaces it (`src/ui/account-panel.test.tsx`).
- `VITE_CONVEX_URL` comes from the root `.env.local` that `convex dev` writes;
  `WXT_SITE_URL` is the web app origin and defaults to `http://localhost:3000`.
  Release builds set both.

## Contract

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
  mount and disposal behavior, and use the WXT context lifecycle helpers.
- Styling is StyleX, compiled with the options in `stylex.config.ts` so the
  web app's tokens (`web/src/styles/tokens.stylex.ts`) compile to the same
  variables here. Extension recipes live in `src/ui/ui.ts`, not
  `web/src/styles/ui.ts`: sizes are px because the host page controls `rem`.
  Every entrypoint imports `web/src/styles/reset.css`, which gives StyleX the
  CSS asset it appends to. Content scripts get their CSS only through that
  import (`cssInjectionMode: 'ui'`): WXT then rewrites `:root` to `:host` so
  tokens resolve in the Shadow Root, and `expectTokensInShadowRoot` in the
  e2e test pins it. Extension pages in `wxt dev` load StyleX's CSS through
  `stylexExtensionPageDev()`, because the stock dev tags are root-relative and
  resolve against `chrome-extension://`.
- Rich components (Glaze, Solid Ark) are not installed. Adopt them through
  `docs/glaze-and-ark.md`, which lists what content scripts additionally need
  (no `rem`, portals and Zag environment inside the Shadow Root, no document
  style injection), and copy the constraints you rely on into this file.
- UI roots call the background only through the oRPC client in
  `src/extension/client.ts`; procedures live in `src/extension/router.ts` and
  are served over `runtime.connect` ports (https://orpc.dev/docs/adapters/browser).
  The client reopens its port after the worker is terminated; keep that
  behavior, and do not auto-retry calls, since mutations are not idempotent.
  Expose only privileged or serialized work there: extension storage and
  Convex are read directly by the UI (see Convex and auth). Give every procedure
  that takes input a valibot `.input()` schema, because content scripts are
  untrusted callers. Extension messaging cannot carry binary data.
- Worker calls that need the click's user gesture (e.g. `sidePanel.open()`)
  must use `runtime.sendMessage`, not oRPC: port messages drop the gesture
  (verified in Chrome 153). Keep that one command outside the router.
- User-visible strings, including manifest `name`/`description`, live in
  `locales/*.yml` and are read through `i18n.t()` from `#i18n`
  (`@wxt-dev/i18n`, typed from the default locale). Reference:
  https://wxt.dev/i18n.html
- Error reporting: only the background owns a Sentry client, configured from
  `WXT_SENTRY_DSN` with no global integrations, per Sentry's
  shared-environment guidance. Other contexts call `reportError()` from
  `src/extension/client.ts`. Never install global error handlers in content
  scripts, where they would capture the host page's errors. Every Solid root
  passes `{ onError: reportError }` to `render()`: errors an `Errored` boundary
  catches reach only that root hook, and it is scoped to our tree, so it is the
  content-script-safe way to hear them.
- Releases go through the manual `Extension Release` workflow
  (`.github/workflows/extension-release.yml`: `wxt submit`, Chrome Web Store
  API v2). Bump this directory's `package.json` version first.
- System Google Chrome no longer accepts command-line extension sideloading.
  Do not download Playwright Chromium as a fallback. Use the repository Chrome
  launcher, which loads the unpacked output through the official experimental
  `Extensions.loadUnpacked` CDP command, and connect E2E automation through the
  same endpoint.
- UI is Solid 2, client-only: `@solidjs/vite-plugin` without start mode runs
  inside WXT's Vite build. Solid 2 is not Solid 1 and not React; read
  `node_modules/solid-js/CHEATSHEET.md` before editing components, and use the
  `solid2` skill for state design. Solid packages are pinned to exact
  pre-release versions that share one runtime; upgrade them together.
- Extension storage is the authority for extension-local shared state (the
  counter example); product data belongs to Convex. UI roots read storage as a
  Solid async source through `live(item)` (`src/extension/live.ts`) and send
  mutations to the background through `action`s; they do not keep a second local
  copy.
