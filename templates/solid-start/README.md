# Solid 2 Start Full-stack Template

An organization-shared full-stack application template built with Solid 2
start mode (SSR), Convex, Better Auth, Stripe, Cloudflare Workers, StyleX, Bun,
and Vite+.

The project deliberately has one package and one dependency graph:

```text
web/       Solid 2 start mode and Cloudflare Workers runtime
convex/    application-scoped backend, auth, data, and billing
extension/ removable companion browser extension (own package.json for WXT)
tooling/   project-wide tooling configuration
```

`web/` and `convex/` are runtime/module boundaries, not workspace packages;
they share the root `package.json` and lockfile. `extension/` keeps its own so
WXT resolves its own Vite; see `extension/README.md`, and its `AGENTS.md` for
removing it.

This is not SolidStart: released SolidStart runs on Solid 1. Solid 2 apps use
`@solidjs/vite-plugin` start mode, which owns the generated client, server, and
Worker entries. See https://v2.solidjs.com/getting-started/project-shapes.

## Create a project

The default branch is the only template source.

```bash
vp create github:celados/templates/templates/solid-start \
  --package-manager bun \
  --no-agent \
  --editor vscode \
  --hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

## Set up a project

```bash
vp install
bun run dev
```

The first `bun run dev` asks you to select or create a Convex project. Convex
writes `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` to `.env.local`; the app
reads both from the repository root.

Configure backend secrets in the selected Convex deployment:

```bash
bunx convex env set SITE_URL http://localhost:3000
bunx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
bunx convex env set GOOGLE_CLIENT_ID ...
bunx convex env set GOOGLE_CLIENT_SECRET ...
bunx convex env set RESEND_API_KEY re_...
bunx convex env set AUTH_EMAIL_FROM "App <auth@example.com>"
bunx convex env set STRIPE_SECRET_KEY sk_test_...
bunx convex env set STRIPE_WEBHOOK_SECRET whsec_...
bunx convex env set STRIPE_PRICE_ID price_...
bun run auth:jwks
```

Better Auth runs on the Convex site. The Worker proxies `/api/auth/*` to it
same-origin (`web/src/routes/api/auth/[...all].ts`), so session cookies stay
first-party and Google needs only one redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

The `/sign-in` route supports Google and a five-minute, single-use magic link
sent through Resend. `bun run auth:jwks` writes deployment-local Static JWKS;
run it once per deployment and again after signing-key rotation.

Create a Stripe webhook endpoint at `<VITE_CONVEX_SITE_URL>/stripe/webhook`.
`convex/billing.ts` exposes checkout, portal, and subscription state.

## How the pieces connect

- `web/src/lib/convex.ts` turns Convex queries into Solid 2 async sources.
  The server renders each query with the visitor's Convex token
  (`web/src/lib/convex-server.ts`, wired in `web/src/middleware.ts`); after
  hydration the browser takes over with a live subscription. Reads suspend the
  nearest `<Loading>`, switch arguments, and unsubscribe on disposal;
  `convex.test.tsx` pins that contract.
- `web/src/lib/auth.ts` exposes `user$` through `AuthContext`; the browser
  client authenticates before its first subscription.
- Mutations are Solid `action`s; the live query remains the source of truth.

## Validate and deploy

```bash
bun run check
bun run build
bunx convex deploy --cmd 'bun run build' --cmd-url-env-var-name VITE_CONVEX_URL
bun run deploy
```

`check` runs formatting, the Solid lint rules, Web and Convex type checks, and
tests. The production build must see the deployment's `VITE_CONVEX_URL` and
`VITE_CONVEX_SITE_URL`; `convex deploy --cmd` supplies the first. Export the
second (`https://<deployment>.convex.site`) in the build environment yourself:
without it the `/api/auth/*` proxy answers 500.
`bun run deploy:temporary` publishes a short-lived preview Worker.
