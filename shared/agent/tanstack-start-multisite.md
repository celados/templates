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
