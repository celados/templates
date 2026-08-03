# TanStack Start Full-stack Template

An organization-shared full-stack application template built with TanStack
Start, Convex, Better Auth, Stripe, Cloudflare Workers, React 19, Tailwind CSS
v4, Bun, and Vite+.

The project deliberately has one package and one dependency graph:

```text
web/       TanStack Start and Cloudflare Workers runtime
convex/    application-scoped backend, auth, data, and billing
tooling/   project-wide tooling configuration
```

`web/` and `convex/` are runtime/module boundaries, not workspace packages.
There is still one root `package.json` and lockfile. Add other root modules such
as `core/` when the application needs them; create a package only when code must
be independently consumed and published.

## Create a project

The default branch is the only template source. The template does not publish or
maintain versioned releases.

```bash
vp create github:celados/templates/templates/tanstack-start \
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
writes the public deployment URLs to `.env.local`. The committed `.env` contains
only public local defaults; do not add secrets to it.

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

Better Auth defaults to passwordless authentication. The bundled
`/auth/sign-in` route supports Google and a five-minute, single-use magic link.
Configure this authorized redirect URI in Google Cloud:

```text
http://localhost:3000/api/auth/callback/google
```

Add the corresponding production URL before deployment. Resend must also be
allowed to send from the domain in `AUTH_EMAIL_FROM`.

`bun run auth:jwks` writes deployment-local Static JWKS into the selected
Convex environment. This embeds the signing key data and removes the remaining
JWKS HTTP lookup from Convex token validation. Until the command is run, the
same configuration falls back to the component's remote JWKS endpoint. Run it
once for every deployment after the auth variables are configured, and refresh
the value whenever signing keys are rotated.

Create a Stripe webhook endpoint at
`<VITE_CONVEX_SITE_URL>/stripe/webhook`. The bundled Stripe component persists
customers, subscriptions, and payments; `convex/billing.ts` exposes a narrow
application API for checkout, portal sessions, and subscription state.

## Task graph

Wireit makes service and code-generation dependencies explicit:

```text
dev
└── web:dev
    ├── convex:dev  (service; waits for "Convex functions ready!")
    └── codegen
        ├── routegen
        └── cf-typegen
```

`routegen` makes checks and builds reproducible even when no generated route
tree exists yet. Add future generators to `codegen.dependencies`; the web
service will wait for all of them without coupling their lifecycle to Convex or
Vite.

Cloudflare bindings and runtime types are generated inside the TypeScript
source tree:

```bash
bun run cf-typegen
```

This writes `web/src/worker-configuration.d.ts`. The template's `check` script
also runs the folder-scoped Web and Convex typechecks plus Wrangler in check
mode so generated contracts cannot drift.

## Validate and deploy

```bash
bun run check
bun run build
bunx convex deploy
bun run deploy
```

The Convex deployment must expose `VITE_CONVEX_URL` and
`VITE_CONVEX_SITE_URL` to the Cloudflare build. `bun run deploy` deploys the
TanStack Start worker after building it; Convex remains a separate deployment
boundary.

The organization Oxfmt baseline lives in `tooling/oxfmt.ts`; generated Convex,
TanStack Router, and Cloudflare type files are excluded from formatting.

The Agent Native project contract and guidance are maintained as a shared layer
with the Astro template.

Authentication implementation sources:

- https://labs.convex.dev/better-auth/experimental
- https://www.better-auth.com/docs/plugins/magic-link
- https://www.better-auth.com/docs/authentication/google
- https://better-auth-ui.com/docs/shadcn/integrations/tanstack-start
