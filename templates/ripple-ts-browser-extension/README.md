# Ripple TS Browser Extension Template

A production-shaped Manifest V3 browser extension template built with Ripple TS,
WXT, Vite+, and Bun.

## Create a project

The default branch is the only template source. The template does not publish or
maintain versioned releases.

```bash
vp create github:celados/templates/templates/ripple-ts-browser-extension \
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
- `entrypoints/sidepanel/`: a separate Ripple root for the Chrome side panel.
- `src/extension/`: runtime-validated messages, storage, and background service.
- `packages/ui/`: source-first, publishable Ripple components with no browser
  API dependency.

The example counter is deliberately end-to-end: both UIs use the same typed
message protocol, the background owns mutations, and versioned
`chrome.storage.local` survives service-worker restarts.

## Develop with system Chrome

Install dependencies and start WXT:

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

`check` covers formatting, linting, TypeScript/TSRX, fake-browser storage tests,
and the publishable package boundary. `build` also verifies MV3 entrypoints and
least-privilege permissions. `zip` produces the Chrome submission artifact in
`.output/`.

## Run system Chrome E2E

Build and open the production output:

```bash
bun run build
bun run chrome
```

Then run in another terminal:

```bash
bun run test:e2e
```

The E2E connects to system Chrome over CDP and verifies the content UI, side
panel, background messages, and shared persisted state. It hard-fails when
system Chrome or the loaded extension is missing.

Branded Chrome removed the command-line flags that previously sideloaded
extensions. The launcher uses the official experimental
`Extensions.loadUnpacked` CDP command instead, preserving system-Chrome coverage
without downloading Playwright Chromium.

If port `9222` is occupied, use the same alternate port for both commands:

```bash
CHROME_CDP_PORT=9333 bun run chrome
CHROME_CDP_PORT=9333 bun run test:e2e
```

## Permissions

The generated manifest contains only `storage` and WXT's side-panel permission.
The example content script uses a narrow `https://example.com/*` match without a
global host permission. Update `scripts/verify-build.ts` whenever a real feature
requires a broader capability so permission drift remains visible in CI.

## Publish a component package

Before publishing `packages/ui`:

1. Rename `@app/ui` to a package scope you own.
2. Update the root dependency and imports.
3. Add repository and license metadata required by your registry.
4. Inspect the package and run a dry publish.

```bash
bun run pack:check
bun publish --cwd packages/ui --dry-run
```

The UI package ships source `.tsrx` files. Consumers must compile it through
Ripple's Vite plugin.

## Sources

- Ripple: https://ripple-ts.com/llms.txt
- TSRX: https://tsrx.dev/llms.txt
- WXT: https://wxt.dev/llms.txt
- Playwright extension testing: https://playwright.dev/docs/chrome-extensions
- Chrome extension testing:
  https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing
- Chrome DevTools `Extensions.loadUnpacked`:
  https://chromedevtools.github.io/devtools-protocol/tot/Extensions/#method-loadUnpacked
