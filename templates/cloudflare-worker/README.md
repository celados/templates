# Cloudflare Worker Backend Template

A backend-only Cloudflare Worker workspace with one deliberate protocol and
deployment path:

- Vite+ and Bun own project management.
- Hono owns the Fetch entrypoint and Better Auth handler.
- oRPC owns the application protocol and distributable client contract.
- PlanetScale Postgres is reached through Cloudflare Hyperdrive at runtime.
- Drizzle owns schema and migrations.
- evlog emits one structured wide event per request.

OpenAPI is intentionally absent. There is no OpenAPI handler, specification,
Scalar UI, Swagger UI, or duplicate REST surface.

## Create a project

```bash
vp create github:celados/templates/templates/cloudflare-worker \
  --package-manager bun \
  --no-agent \
  --editor vscode \
  --hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

## Prepare the project

```bash
vp install
cp .env.example .env
cp .dev.vars.example .dev.vars
```

`vp install` runs the package `prepare` script, which restores the
project-scoped TypeScript, Cloudflare, GitHub Actions, and private-package
publishing guidance from `.agents/skills/manifest.json`, then builds the local
API contract package.

Before running the service:

1. Create a PlanetScale Postgres database and a role for its primary branch.
2. Create a Cloudflare Hyperdrive configuration connected to that branch.
3. Replace the zero Hyperdrive ID in `wrangler.jsonc`.
4. Put a random Better Auth secret of at least 32 bytes in `.dev.vars`.
5. Put the direct primary connection string in `.env` as `DATABASE_URL`.
6. Use the same connection string for
   `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`.

The direct URL exists only for migrations and local Wrangler development.
Deployed Worker requests use `env.HYPERDRIVE.connectionString`; do not add
`DATABASE_URL` as a Worker secret.

## Create the database schema

```bash
bun run db:generate
bun run db:migrate
```

Use `db:push` only for disposable development branches. Committed migrations
remain the production schema history.

## Develop and validate

```bash
bun run dev
bun run check
bun run build
```

Local development runs at `http://localhost:8787`. The application surface is:

- `/rpc`: oRPC RPC protocol.
- `/api/auth/*`: Better Auth Hono handler.
- `/`: small discovery response; not a second application API.

Before deployment, replace the local `BETTER_AUTH_URL` and `CORS_ORIGIN` values
in `wrangler.jsonc`, then set the production auth secret:

```bash
bunx wrangler secret put BETTER_AUTH_SECRET
bun run deploy
```

## oRPC capability examples

The contract-first sample deliberately exercises several independent protocol
paths:

| Procedure        | Capability                                               |
| ---------------- | -------------------------------------------------------- |
| `system.health`  | validated input/output-free health call                  |
| `auth.viewer`    | Better Auth session context and typed unauthorized error |
| `todos.*`        | Hyperdrive, Drizzle CRUD, and typed not-found errors     |
| `events.ticks`   | resumable SSE/event iterator with event metadata         |
| `files.inspect`  | multipart `File` upload and SHA-256 processing           |
| `files.download` | typed `File` download                                    |

The Worker also demonstrates oRPC middleware, lifecycle hooks, request context,
body limits, runtime input validation, and request-scoped oRPC timing added to
the evlog wide event. Outputs use exported TypeScript types with oRPC's
`type<Output>()` helper; they are not runtime-validated.

## Distribute the API client

`packages/api-contract` contains only Standard Schema contracts and the
`createApiClient` factory. It imports no Worker, Hono, database, or auth
implementation.

Before publishing:

1. Rename `@app/api-contract` to `@celados/<project>-api`.
2. Add repository metadata.
3. Follow the installed `publish-package` skill to render root registry auth.
4. Prove the package artifact.

```bash
bun run pack:check
```

Consumers install the package and call procedures without reproducing routes or
wire schemas:

```ts
import { createApiClient } from '@celados/example-api'

const api = createApiClient({
	url: 'https://api.example.com/rpc',
})

const health = await api.system.health()
```

## Layout

```text
apps/worker/          Hono entrypoint and oRPC implementations
packages/api-contract distributable contract and client factory
packages/auth/        Better Auth composition
packages/db/          Drizzle schema, migrations, and Hyperdrive client scope
```

## Sources

- oRPC: https://orpc.dev/llms.txt
- Cloudflare Hyperdrive: https://developers.cloudflare.com/hyperdrive/llms.txt
- PlanetScale: https://planetscale.com/docs/llms.txt
- Better Auth: https://better-auth.com/llms.txt
- Vite+: https://viteplus.dev/llms.txt
