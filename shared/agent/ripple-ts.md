## Ripple TS workspace contract

- TypeScript is intentionally pinned to `^5.9.3` because the current Ripple
  language server and TSRX TypeScript plugin both require that peer range. Do
  not upgrade TypeScript until both packages declare support for the newer line
  and `bun run check && bun run build` pass.
- Before inspecting or editing application or component code, read
  https://ripple-ts.com/llms.txt in full.
- When changing TSRX syntax, compiler or language tooling, or behavior shared
  across compiler targets, also read https://tsrx.dev/llms.txt. Ripple docs are
  authoritative for the runtime; TSRX docs are authoritative for the language.
- Use TSRX lazy destructuring (`&{ ... }` / `&[ ... ]`) when destructured props
  or values must remain reactive. Ordinary JavaScript destructuring reads
  Ripple's generated getters immediately and turns them into snapshots.
- Keep component props as ordinary domain values by default. Pass a
  `Tracked<T>` handle only when the child intentionally needs the tracked
  identity or write access, and read or write that handle through `.value`.
