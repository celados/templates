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

## Cloudflare Worker backend contract

- TypeScript is intentionally pinned to the latest 6.x line because the current
  `tsdown` release warns that TypeScript 7's compiler API is experimental. Do
  not upgrade until contract declaration builds are warning-free.
- Before inspecting or changing oRPC contracts, procedures, handlers, clients,
  streaming, or file transfer, read https://orpc.dev/llms.txt and the relevant
  linked pages.
- Validate procedure inputs with Valibot. Define every output with an exported
  TypeScript type and oRPC's `type<Output>()` helper; do not add output schemas
  or `ResponseValidationPlugin`.
- Before changing database bindings or connection lifecycle, read
  https://developers.cloudflare.com/hyperdrive/llms.txt and the current
  PlanetScale Postgres connection guidance at https://planetscale.com/docs/llms.txt.
- Before changing authentication, read https://better-auth.com/llms.txt and the
  current Hono and Drizzle adapter guidance.
- This project deliberately exposes only the oRPC RPC protocol. Do not add
  `@orpc/openapi`, an OpenAPI handler/specification, Scalar, Swagger, or
  REST-shaped duplicate routes.
- `packages/api-contract` is the distributable client boundary, and the only
  directory here that owns a `package.json`: it publishes to npm.celados.com, so
  its dependencies have to resolve for consumers who never see this repository.
  Keep schemas, the contract, and the client factory free of Worker, Hono,
  database, and auth implementation imports.
- Everything else is one deployable with one root `package.json`. Worker, auth,
  and database code live under `src/` and reach each other through the `@/*`
  path alias. Do not reintroduce internal workspace packages.
- Worker runtime database traffic must use the `HYPERDRIVE` binding. Drizzle Kit
  migrations use the direct `DATABASE_URL`; never ship that credential as a
  Worker runtime variable.
- Hyperdrive owns connection pooling. Open `pg` clients only around procedures
  that need the database and close them deterministically; do not hold a
  process-global client or keep one open for SSE procedures.
- Compose common middleware once on the contract implementer. Extend
  `publicProcedures` into narrower layers such as `databaseProcedures`; do not
  repeat the same `.use(...)` chain on every procedure.
- `bun run cf-typegen` owns the committed Worker runtime and binding types under
  `src/`. Do not add `@cloudflare/workers-types` or hand-maintain a
  competing binding interface.
