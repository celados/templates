# Reusable Ripple components

- Export ordinary named `.tsrx` components through `src/index.tsrx`.
- Keep public props explicit and independent of Chrome, WXT, storage, and
  message APIs.
- Use TSRX lazy prop destructuring (`&{ ... }`) whenever a destructured prop
  must keep updating; ordinary JavaScript destructuring snapshots reactive
  getters at component creation.
- The package is source-first: the consuming Ripple Vite graph owns TSRX
  compilation. Do not add a parallel precompiled runtime without a real
  consumer requirement.
- Keep extension lifecycle, permissions, application state, and cross-context
  communication outside this package.
- Run the root check and build plus `bun run pack:check` after changing the
  public package boundary.
