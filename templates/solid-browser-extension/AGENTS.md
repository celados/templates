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
- UI roots call the background only through the oRPC client in
  `src/extension/client.ts`; procedures live in `src/extension/router.ts` and
  are served over `runtime.connect` ports (https://orpc.dev/docs/adapters/browser).
  The client reopens its port after the worker is terminated; keep that
  behavior, and do not auto-retry calls, since mutations are not idempotent.
  Expose only privileged or serialized work there: storage and backend data
  (e.g. a Convex client authenticated with a Better Auth token) are read
  directly by the UI, never proxied through the worker. Give every procedure
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
