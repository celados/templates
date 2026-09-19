# Browser extension entrypoints

- Keep `background.ts` small: serve the oRPC router synchronously
  (before any `await`) and MV3 lifecycle handlers, then delegate durable
  behavior to `src/extension/`.
- Background memory is disposable. Never rely on module state for data that
  must survive service-worker suspension or browser restart.
- Keep content scripts in the isolated world. Mount page UI through WXT's
  Shadow Root helper, preserve event isolation, and return Solid's `render()`
  disposer so WXT can tear the root down.
- Side-panel and content-script UIs are separate Solid roots. Share components
  and the typed `background` client, not hidden mutable module state.
- Add permissions, host matches, or main-world injection only with a concrete
  feature and update the manifest verifier in the same change.
- Read https://wxt.dev/llms.txt and `node_modules/solid-js/CHEATSHEET.md`
  before changing entrypoint or component behavior.
