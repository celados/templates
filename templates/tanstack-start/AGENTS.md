<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

After completing a meaningful development stage, if the project defines
`deploy:temporary`, use it when an online preview would help verify or share the
result. Return the deployment URL and the time-sensitive Cloudflare claim URL
to the user.

<!--VITE PLUS END-->

# TanStack Start + Convex

This is one full-stack application with one root `package.json`. `web/` owns
the TanStack Start runtime and its configuration; `convex/` is a peer,
application-scoped backend module. Neither is a separate package or workspace.
Add other application modules at the root and connect them with TypeScript path
aliases; introduce a package boundary only when code is independently consumed
and published.

Before editing Convex integration code, read the current source-of-truth
documentation:

- https://docs.convex.dev/llms.txt
- https://labs.convex.dev/better-auth/framework-guides/tanstack-start
- https://labs.convex.dev/better-auth/experimental
- https://www.better-auth.com/docs/plugins/magic-link
- https://better-auth-ui.com/docs/shadcn/integrations/tanstack-start
- https://github.com/get-convex/stripe
- https://tanstack.com/start/latest/docs/framework/react/guide/execution-model
- https://tanstack.com/start/latest/docs/framework/react/guide/import-protection

Do not edit `convex/_generated/` or `web/src/route-tree.gen.ts` by hand.
Convex generates and expects its `_generated` files to be committed. TanStack
Router owns the route tree.

Use `*.server.ts` for modules that must never enter the client bundle. Use
`*.client.ts` only when a module must also be rejected from the SSR bundle; a
library type named "client" does not imply a client-only module.
`web/src/lib/auth-client.ts` is intentionally isomorphic because the root
provider imports it during SSR, while `web/src/lib/auth.server.ts` is
server-only.

`bun run dev` uses Wireit to wait for the Convex service and the `codegen`
aggregate before starting the web service. Add independent generators to
`codegen.dependencies`; do not hide them in framework-specific start commands.

Keep secrets in the Convex deployment environment. Only public deployment URLs
use the `VITE_` prefix. Stripe checkout price IDs are server-owned configuration;
never accept an arbitrary Stripe price ID from a browser action.

Static JWKS is an explicit deployment setup step: after configuring auth
secrets, run `bun run auth:jwks` once for each Convex deployment and refresh it
after signing-key rotation. Do not copy a JWKS value between environments.

The focused `/auth/sign-in` UI intentionally follows Better Auth UI's
integration model without vendoring its full registry. Keep Google and magic
link as the passwordless defaults; add the registry only when the product
actually needs its broader auth-view system.
