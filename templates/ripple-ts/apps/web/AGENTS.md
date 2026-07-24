# Ripple application

- Keep the browser mount lifecycle in `apps/web`.
- Author components in `.tsrx`; use Ripple's `track`, `@if`, `@for`, `@switch`,
  and `@try` semantics instead of importing another UI framework.
- Move a component into `packages/ui` only when it has an application-independent
  interface and a real reuse or publication boundary.
- Keep app-only orchestration, routes, data loading, and product styling out of
  reusable packages.
- Read https://www.ripple-ts.com/llms.txt before changing Ripple syntax or
  runtime integration.
