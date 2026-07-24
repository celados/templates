# Browser extension entrypoints

- Keep `background.ts` small: register MV3 lifecycle and message handlers, then
  delegate durable behavior to `src/extension/`.
- Background memory is disposable. Never rely on module state for data that
  must survive service-worker suspension or browser restart.
- Keep content scripts in the isolated world. Mount page UI through WXT's
  Shadow Root helper, preserve event isolation, and dispose Ripple when WXT
  removes the UI.
- Side-panel and content-script UIs are separate Ripple roots. Share components
  and typed clients, not hidden mutable module state.
- Add permissions, host matches, or main-world injection only with a concrete
  feature and update the manifest verifier in the same change.
- Read https://wxt.dev/llms.txt and https://ripple-ts.com/llms.txt before
  changing entrypoint or component behavior.
