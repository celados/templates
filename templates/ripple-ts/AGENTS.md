<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

After completing a meaningful development stage, if the project defines
`deploy:temporary`, use it when an online preview would help verify or share the
result. Return the deployment URL and the time-sensitive Cloudflare claim URL
to the user.

<!--VITE PLUS END-->

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
