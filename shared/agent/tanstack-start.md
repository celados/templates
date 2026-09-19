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
secrets, run `bun run auth:jwks` once for each Convex deployment and refresh it
after signing-key rotation. Do not copy a JWKS value between environments.

The focused `/auth/sign-in` UI intentionally follows Better Auth UI's
integration model without vendoring its full registry. Keep Google and magic
link as the passwordless defaults; add the registry only when the product
actually needs its broader auth-view system.

`better-auth` is held at `~1.6` because `@convex-dev/better-auth` declares a
`<1.7` peer range; widen it only after the component does.
