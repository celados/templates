## Ripple TS workspace contract

- TypeScript is intentionally pinned to `^5.9.3` because the current Ripple
  language server and TSRX TypeScript plugin both require that peer range. Do
  not upgrade TypeScript until both packages declare support for the newer line
  and `bun run check && bun run build` pass.
- Do not use ordinary JavaScript destructuring in `.tsrx` files. Reactive state
  uses TSRX-specific destructuring syntax; learn the correct form from the
  indexes below before inspecting or editing code.
- Before inspecting or editing application or component code, read
  https://ripple-ts.com/llms.txt in full.
- When changing TSRX syntax, compiler or language tooling, or behavior shared
  across compiler targets, also read https://tsrx.dev/llms.txt. Ripple docs are
  authoritative for the runtime; TSRX docs are authoritative for the language.
