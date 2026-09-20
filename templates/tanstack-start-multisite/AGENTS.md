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

## Dead code

`bun run check` ends with `fallow dead-code`, a project-graph pass that finds
what a file-level linter cannot: files no entry point reaches, exports with no
consumer, and dependencies that are declared but unused or used but undeclared.
Fix what it reports; do not reach for a suppression first.

When a finding is wrong, the cause is almost always that something reaches the
code through a mechanism the static graph cannot follow — a generated route
tree, a runtime glob, a string in a config. Say so in `.fallowrc.jsonc` with the
narrowest key that fits (`entry`, `dynamicallyLoaded`, `ignoreDependencies`,
`ignoreUnresolvedImports`) and a comment naming the mechanism.
`fallow-plugin-viteplus.jsonc` already covers the toolchain's own conventions.

Fallow's own skill ships inside the pinned package at
`node_modules/fallow/skills/fallow/SKILL.md`, with references beside it. Read it
when a task needs more of the tool than `dead-code` — tracing why a symbol is
reported, scoping a run to changed files, the JSON envelopes. It is not
installed as a project skill because the package copy cannot drift from the
binary the lockfile pins.

# TanStack Start + Convex Multi-site

This is one full-stack product with one root `package.json`. `sites/alpha/` and
`sites/beta/` are independently developed and deployed TanStack Start runtimes;
`shared/` owns product UI and browser/server integration; `convex/` is the shared
application backend. These are module boundaries, not workspace packages.

Each site exclusively owns its `vite.config.ts`, `tsconfig.json`, `wrangler.jsonc`,
`src/router.tsx`, `src/routes/**`, `src/route-tree.gen.ts`,
`src/worker-configuration.d.ts`, `public/`, cache, and build output. Never point
two sites at one generated file or include two router registrations in one
TypeScript program. Shared route-aware code may depend only on paths present in
every site; otherwise accept navigation through a site adapter.

Before editing Convex integration code, read the current source-of-truth
documentation:

- https://docs.convex.dev/llms.txt
- https://labs.convex.dev/better-auth/framework-guides/tanstack-start
- https://www.better-auth.com/docs/guides/dynamic-base-url
- https://www.better-auth.com/docs/plugins/magic-link
- https://github.com/get-convex/stripe
- https://tanstack.com/start/latest/docs/framework/react/guide/execution-model
- https://tanstack.com/start/latest/docs/framework/react/guide/import-protection

Do not edit generated Convex, Router, or Wrangler types by hand. `bun run
codegen` owns both sites' route trees and Worker declarations. A fresh clone
must pass codegen, both site typechecks, and both builds without relying on a
previously selected site.

`bun run dev` starts one Convex service and both sites on strict ports. Add a
generator to the relevant `codegen:<site>` dependency; do not hide generation
inside a Vite start command. Worktrees may isolate tasks, but are not required
to run both sites.

Use `*.server.ts` for modules that must never enter the client bundle. Use
`*.client.ts` only when a module must also be rejected from SSR. Shared modules
are compiled once per site TypeScript program, so they must remain valid for
both adapters.

Better Auth uses dynamic base URL resolution. Keep every allowed development
and production host in the Convex `AUTH_ALLOWED_HOSTS` environment variable;
unknown hosts must fail instead of falling back silently. Browser sessions are
origin-scoped unless the deployed sites deliberately share a parent-domain
cookie policy.

Stripe checkout accepts a site ID, never a browser-provided price or return
URL. `SITE_ALPHA_URL`, `SITE_BETA_URL`, price IDs, and secrets are server-owned
Convex environment values. When adding a site, extend the frontend `SiteId`,
the Convex validator and URL resolver, both OAuth redirect registrations, and
the codegen/build/deploy task graph together.

The Convex client's identity has one chain: `ConvexBetterAuthProvider` in the
root route, over a `ConvexQueryClient` created with `expectAuth: true` so no
query goes out before the first token. Do not add a second component that calls
`setAuth`; two chains overwrite each other, and a session refetch can resend
subscriptions without an identity. A replacement chain must call `clearAuth()`
on sign-out (re-arming `setAuth` pauses the socket, and Convex drops the
unauthenticate sent while paused, so the server keeps the old identity until
the JWT expires) and must re-arm after a client-side sign-in. Gate
authenticated queries on `useConvexAuth()`, which the backend confirms, not on
`useSession()`. A Convex function that reads the Better Auth session (for
example `authComponent.getAuthUser`) fails once sign-out deletes it, so
unmount its subscribers before the sign-out request instead of after the
session query answers.

Static JWKS is an explicit deployment setup step: after configuring auth
secrets, run `bun run auth:jwks` once per Convex deployment and refresh it after
signing-key rotation. Do not copy a JWKS value between environments.

`better-auth` is held at `~1.6` because `@convex-dev/better-auth` declares a
`<1.7` peer range; widen it only after the component does.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
