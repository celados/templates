# Reusable Ripple components

- Export ordinary named `.tsrx` components through `src/index.tsrx`.
- Keep public props explicit and application-independent.
- The package is source-first: the consuming Ripple Vite graph owns TSRX
  compilation. Do not add a parallel precompiled runtime without a real consumer
  requirement.
- Keep app orchestration, route state, and application data access out of this
  package.
- Run the root check and build plus `bun run pack:check` after changing the
  public package boundary.
