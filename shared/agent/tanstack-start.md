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
- https://github.com/get-convex/stripe

Do not edit `convex/_generated/` or `web/src/route-tree.gen.ts` by hand.
Convex generates and expects its `_generated` files to be committed. TanStack
Router owns the route tree.

`bun run dev` uses Wireit to wait for the Convex service and the `codegen`
aggregate before starting the web service. Add independent generators to
`codegen.dependencies`; do not hide them in framework-specific start commands.

Keep secrets in the Convex deployment environment. Only public deployment URLs
use the `VITE_` prefix. Stripe checkout price IDs are server-owned configuration;
never accept an arbitrary Stripe price ID from a browser action.
