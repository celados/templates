# Solid Browser Extension Template

A production-shaped Manifest V3 browser extension template built with Solid 2,
WXT, Vite+, and Bun.

## Create a project

The default branch is the only template source.

```bash
vp create github:celados/templates/templates/solid-browser-extension \
  --package-manager bun \
  --no-agent \
  --editor vscode \
  --hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

## Architecture

- `entrypoints/background.ts`: ephemeral MV3 service worker; registers the
  background service before any `await`.
- `entrypoints/content/`: isolated Shadow DOM UI injected on `example.com`.
- `entrypoints/sidepanel/`: a separate Solid root for the Chrome side panel.
- `src/extension/`: the background oRPC router (`router.ts`) and its
  reconnecting client (`client.ts`), storage, the storage-backed Solid async
  source, and error reporting.
- `src/ui/`: Solid components shared by both roots, with no browser API
  dependency beyond the typed `background` client.
- `locales/`: typed messages for UI and manifest strings (`@wxt-dev/i18n`).

The example counter is deliberately end-to-end: both UIs read versioned
`chrome.storage.local` as a live Solid source, call
`background.counter.increment()` through Solid `action`s, and stay in sync
across contexts and service-worker restarts.

The background service is for privileged or serialized work only. With a
Convex + Better Auth backend, UI roots hold their own Convex client and read
data directly; routing data through the worker turns it into a hand-written
cache and sync layer.

Solid is used client-only: `@solidjs/vite-plugin` runs inside WXT's Vite build
without start mode, and each root mounts with `render()` from `@solidjs/web`.

## Develop with system Chrome

```bash
vp install
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

`check` covers formatting, Solid lint rules, TypeScript, and fake-browser
storage tests. `build` also verifies MV3 entrypoints, compiled locales, and
least-privilege permissions. `zip` produces the Chrome submission artifact in `.output/`.

## Error reporting

Set `WXT_SENTRY_DSN` at build time to enable Sentry; without it the SDK is
tree-shaken out and errors go to the console. Only the background worker owns
a client, created per Sentry's
[shared-environment guidance](https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/);
other contexts forward errors with `reportError()`. In Sentry, disable the
inbound filter for browser-extension errors.

## Release

The manual `Release` workflow checks, zips, and runs `wxt submit` against the
Chrome Web Store API v2. It defaults to a dry run. Configure repository
variables `CHROME_EXTENSION_ID`, `CHROME_PUBLISHER_ID`, and optional
`WXT_SENTRY_DSN`, plus secrets `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` and
`CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`. `bunx wxt submit init` walks through
obtaining them. The first store listing is still created by hand.

## Run system Chrome E2E

```bash
bun run build
bun run chrome
```

Then, in another terminal:

```bash
bun run test:e2e
```

`bun run chrome` starts Chrome headless so automated runs never open windows or
take focus; `chrome:dev` stays headed for interactive work. The E2E connects
over CDP and verifies the content UI, side panel, shared persisted state, and
that the oRPC client reconnects after Chrome stops the service worker. If port `9222` is
occupied, use the same alternate port for both commands:

```bash
CHROME_CDP_PORT=9333 bun run chrome
CHROME_CDP_PORT=9333 bun run test:e2e
```

## Permissions

The generated manifest contains only `storage` and WXT's side-panel permission.
The example content script uses a narrow `https://example.com/*` match without a
global host permission. Update `scripts/verify-build.ts` whenever a real feature
requires a broader capability so permission drift remains visible in CI.

## Sources

- Solid 2: https://v2.solidjs.com/llms.txt
- WXT: https://wxt.dev/llms.txt
- Chrome extension testing:
  https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing
- Chrome DevTools `Extensions.loadUnpacked`:
  https://chromedevtools.github.io/devtools-protocol/tot/Extensions/#method-loadUnpacked
