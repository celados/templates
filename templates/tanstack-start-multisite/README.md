# TanStack Start Multi-site Full-stack Template

An organization-shared starter for one product exposed through multiple sites.
Alpha and Beta own independent TanStack Start route trees, Vite development
servers, Cloudflare Workers, generated types, caches, and build output. They
share the product's Convex backend, authentication data, billing, UI, and
application modules.

Use this template when the sites intentionally share user identity, data,
billing, and backend release lifecycle. Use the single-site `tanstack-start`
template for independent products that merely have similar UI.

## Layout

```text
sites/
  alpha/    Site adapter: routes, Router registration, Vite, Worker, public assets
  beta/     A second independently runnable and deployable site adapter
shared/     Product UI, auth integration, application modules, styles
convex/     Shared backend, identity, data, and billing
tooling/    Product-wide Vite+ policy and the shared site config factory
```

The project deliberately has one root `package.json` and dependency graph.
Directories are runtime and module boundaries, not workspace packages. A site
may depend on `shared/`; shared code must not import a site adapter.

## Create a project

```bash
vp create github:celados/templates/templates/tanstack-start-multisite \
  --package-manager bun \
  --no-agent \
  --editor vscode \
  --hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

## Set up the product

```bash
vp install
bun run dev
```

`bun run dev` starts one Convex development service, Alpha on strict port 3000,
and Beta on strict port 3001. Each site has a separate Router generator and
Worker type generator, so both may run without changing the other's files.

The first run asks you to select or create one Convex project. Configure its
environment after `.env.local` receives the public deployment URLs:

```bash
bunx convex env set AUTH_ALLOWED_HOSTS \
  "localhost:3000,localhost:3001,alpha.example.com,beta.example.com"
bunx convex env set SITE_ALPHA_URL http://localhost:3000
bunx convex env set SITE_BETA_URL http://localhost:3001
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

`AUTH_ALLOWED_HOSTS` is an explicit Better Auth allowlist of `host[:port]`
values. Dynamic base URL resolution gives each site its own OAuth and magic-link
callback origin while both sites use the same identity store. Register both
production callback URLs with the OAuth provider. Browser sessions remain
origin-scoped unless the sites deliberately configure a shared parent-domain
cookie policy.

Create the Stripe webhook at `<VITE_CONVEX_SITE_URL>/stripe/webhook`. Checkout
and portal actions accept only the known site ID; return URLs and Stripe price
IDs remain server-owned Convex configuration.

## Task graph

```text
dev
├── dev:alpha
│   ├── convex:dev  (shared service)
│   └── codegen:alpha
│       ├── routegen:alpha
│       └── cf-typegen:alpha
└── dev:beta
    ├── convex:dev  (same shared service)
    └── codegen:beta
        ├── routegen:beta
        └── cf-typegen:beta
```

`bun run build` also builds both sites concurrently through isolated outputs.
Use the focused scripts when working on one adapter:

```bash
bun run dev:alpha
bun run dev:beta
bun run build:alpha
bun run build:beta
```

## Add another site

Copy a site adapter, then change all ownership points together:

1. Add its `SiteId` and `SiteConfig` value.
2. Give it a unique port, Wrangler name, generated route tree, Worker types,
   cache, and TypeScript build info.
3. Add its codegen, typecheck, build, preview, and deploy tasks.
4. Extend the Convex site validator and server-owned URL resolver.
5. Add development and production hosts to `AUTH_ALLOWED_HOSTS` and OAuth.

Do not introduce one generated route tree selected by mode. That recreates the
cross-process overwrite this layout is designed to eliminate.

## Validate and deploy

```bash
bun run check
bun run build
bunx convex deploy
bun run deploy:alpha
bun run deploy:beta
```

The organization Oxfmt baseline lives in `tooling/oxfmt.ts`; generated Convex,
TanStack Router, and Cloudflare files are excluded from formatting. Each site
deploys through its own Wrangler configuration after the shared Convex backend
has been deployed.
