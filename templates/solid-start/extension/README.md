# Companion Browser Extension

A Manifest V3 extension built with Solid 2, WXT, and Bun, living next to the
web app and sharing its Convex backend. It has its own `package.json`; root
`bun install` installs it, and root `check`/`build` cover it. Delete it with
the checklist in `AGENTS.md` when the product has no extension.

## Architecture

- `entrypoints/background.ts`: ephemeral MV3 service worker; registers the
  background service before any `await`.
- `entrypoints/content/`: isolated Shadow DOM UI injected on `example.com`.
- `entrypoints/sidepanel/`: a separate Solid root for the Chrome side panel.
- `src/extension/`: the background oRPC router (`router.ts`) and its
  reconnecting client (`client.ts`), storage, the storage-backed Solid async
  source, and error reporting.
- `src/backend/`: the side panel's live Convex client, the session-cookie
  token source, and the stored snapshots that paint the first frame.
- `src/ui/`: Solid components. The counter is shared by both roots; the
  account panel is side-panel only.
- `locales/`: typed messages for UI and manifest strings (`@wxt-dev/i18n`).

The example counter is deliberately end-to-end: both UIs read versioned
`chrome.storage.local` as a live Solid source, call
`background.counter.increment()` through Solid `action`s, and stay in sync
across contexts and service-worker restarts.

The account panel is the product-data example: the side panel holds its own
Convex client, signs in through the web app's session, and lists the user's
todos from `convex/todos.ts`. The last live answers are stored per user, so
reopening the panel renders them in the first frame instead of a spinner;
live answers replace them in place. The background service is for privileged
or serialized work only; routing Convex data through the worker would turn it
into a hand-written cache and sync layer.

Solid is used client-only: `@solidjs/vite-plugin` runs inside WXT's Vite build
without start mode, and each root mounts with `render()` from `@solidjs/web`.

## Develop with system Chrome

Commands in this file run inside `extension/` after a root `bun install`.

```bash
bun run dev
```

In another terminal, open the repository-owned system Chrome profile:

```bash
bun run chrome:dev
```

The launcher installs `.output/chrome-mv3-dev` through Chrome's official
`Extensions.loadUnpacked` CDP command and prints the extension ID and endpoint.
WXT intentionally does not open or download a browser itself. Each launch
clears the profile's service-worker registrations, because Chrome otherwise
keeps running the previous build's background script while the manifest
version is unchanged; extension storage is kept.

## Validate and package

```bash
bun run check
bun run build
bun run zip
```

`check` covers TypeScript, fake-browser storage tests, and the snapshot and
persisted-query contract. `build` also verifies MV3 entrypoints, compiled locales, and
least-privilege permissions. `zip` produces the Chrome submission artifact in `.output/`.

## Error reporting

Set `WXT_SENTRY_DSN` at build time to enable Sentry; without it the SDK is
tree-shaken out and errors go to the console. Only the background worker owns
a client, created per Sentry's
[shared-environment guidance](https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/);
other contexts forward errors with `reportError()`. In Sentry, disable the
inbound filter for browser-extension errors.

## Sign in

Run the web app (`bun run dev` at the project root) and open the side panel.
**Sign in on the web app** opens its sign-in page; once signed in there, the
panel picks up the session without a reload, and signing out on the web app
empties it. A production build points at the deployed web app through
`WXT_SITE_URL`.

## Release

The manual `Extension Release` workflow checks, zips, and runs `wxt submit` against the
Chrome Web Store API v2. It defaults to a dry run. Configure repository
variables `CHROME_EXTENSION_ID`, `CHROME_PUBLISHER_ID`, `VITE_CONVEX_URL`,
`WXT_SITE_URL`, and optional `WXT_SENTRY_DSN`, plus secrets `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` and
`CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`. `bunx wxt submit init` walks through
obtaining them. The first store listing is still created by hand.

## Run system Chrome E2E

```bash
bun run build
bun run chrome
```

The build needs a `VITE_CONVEX_URL`. Any deployment works, because the test
blocks the network to it and to the web app. Then, in another terminal:

```bash
bun run test:e2e
```

`bun run chrome` starts Chrome headless so automated runs never open windows or
take focus; `chrome:dev` stays headed for interactive work. The E2E connects
over CDP and verifies the content UI, side panel, shared persisted state,
that the oRPC client reconnects after Chrome stops the service worker, and
that a stored snapshot renders in the account panel's first frame, against a
control run where nothing is stored and the Loading fallback shows. If port
`9222` is occupied, use the same alternate port for both commands:

```bash
CHROME_CDP_PORT=9333 bun run chrome
CHROME_CDP_PORT=9333 bun run test:e2e
```

## Permissions

The generated manifest requests `storage`, `cookies`, WXT's side-panel
permission, and one host permission: the web app's host, whose session cookie
mints Convex tokens and whose cookie changes signal sign-in and sign-out. The
example content script uses a narrow `https://example.com/*` match. Update `scripts/verify-build.ts` whenever a real feature
requires a broader capability so permission drift remains visible in CI.

## Sources

- Solid 2: https://v2.solidjs.com/llms.txt
- WXT: https://wxt.dev/llms.txt
- Chrome extension testing:
  https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing
- Chrome DevTools `Extensions.loadUnpacked`:
  https://chromedevtools.github.io/devtools-protocol/tot/Extensions/#method-loadUnpacked
