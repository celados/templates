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

- `entrypoints/background.ts`: ephemeral MV3 service worker registration.
- `entrypoints/content/`: isolated Shadow DOM UI injected on `example.com`.
- `entrypoints/sidepanel/`: a separate Solid root for the Chrome side panel.
- `src/extension/`: runtime-validated messages, storage, the background
  service, and the storage-backed Solid async source.
- `src/ui/`: Solid components shared by both roots, with no browser API
  dependency beyond the typed client.

The example counter is deliberately end-to-end: both UIs read versioned
`chrome.storage.local` as a live Solid source, send mutations to the
background through Solid `action`s, and stay in sync across contexts and
service-worker restarts.

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
WXT intentionally does not open or download a browser itself.

## Validate and package

```bash
bun run check
bun run build
bun run zip
```

`check` covers formatting, Solid lint rules, TypeScript, and fake-browser
storage tests. `build` also verifies MV3 entrypoints and least-privilege
permissions. `zip` produces the Chrome submission artifact in `.output/`.

## Run system Chrome E2E

```bash
bun run build
bun run chrome
```

Then, in another terminal:

```bash
bun run test:e2e
```

The E2E connects to system Chrome over CDP and verifies the content UI, side
panel, background messages, and shared persisted state. If port `9222` is
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
