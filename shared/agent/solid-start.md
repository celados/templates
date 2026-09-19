# Solid 2 Start + Convex

This is one full-stack application with one root `package.json`. `web/` owns
the Solid 2 start-mode runtime (SSR on Cloudflare Workers); `convex/` is a
peer, application-scoped backend module. Neither is a separate package or
workspace. The runtime set is `solid-js`, `@solidjs/web`,
`@solidjs/vite-plugin`, `@solidjs/router`, and `@solidjs/meta`; never introduce
`@solidjs/start`, Vinxi, or Nitro — released SolidStart runs on Solid 1.

## Before editing `web/`

Solid 2 is not Solid 1 and not React. Read
`node_modules/solid-js/CHEATSHEET.md` before editing anything under `web/`;
1.x and React priors compile here and then misbehave at runtime. The
`solid-migration` skill covers the same reset plus state-design patterns.
Current documentation: https://v2.solidjs.com/llms.txt and the RFCs at
https://github.com/solidjs/solid/tree/next/documentation/solid-2.0.

Solid packages are pinned to exact pre-release versions that share one
runtime. `latest` is not a compatibility signal during the Solid 2 rollout;
upgrade them together after checking peer ranges, and keep a single
`@solidjs/signals` in the lockfile.

## Module boundaries

- TypeScript source filenames use kebab-case. `web/src/app.tsx` and
  `web/src/document.tsx` are start-mode entry files; route modules keep the
  `filesystem-routing` filename convention (`[param]`, `[...rest]`).
- Avoid default exports except where start mode and `filesystem-routing`
  require them: the app root, document shell, middleware, and page modules.
- `web/src/routes/**` owns URL-facing pages; uppercase `GET`/`POST` exports in
  `web/src/routes/api/**` answer requests through `web/src/middleware.ts`.
- `web/src/lib/convex.ts` is the only browser entry to Convex live queries.
  Keep Convex function selection typed through `convex/_generated/api`.
  Queries start after hydration (`ssrSource: 'client'`) and must sit under a
  `<Loading>` unless they declare a `loadingValue`.
- `web/src/lib/auth.ts` owns Better Auth. Auth HTTP traffic is proxied
  same-origin through `web/src/routes/api/auth/[...all].ts` to the Convex site,
  so cookies stay first-party.
- Styling is StyleX. Tokens live in `web/src/styles/*.stylex.ts`; read the
  `stylex-authoring` skill before adding themes or variables.
- Errors Solid handles (boundary fallbacks, rejected `Loading` fragments) reach
  only the runtime error hooks: `web/src/lib/client-errors.ts` and
  `web/src/instrument.ts`. Wire a monitor there, not per `Errored` fallback.
  The build is `observe: true`, so their paths name components; see
  https://v2.solidjs.com/guides/observability

## Generated files

Do not edit `web/file-routes.d.ts`, `web/solid-env.d.ts`, or
`convex/_generated/**` by hand. The Solid plugin regenerates the first two on
every dev and build start; Convex regenerates `_generated` during
`convex dev`. Commit regenerated output.

## Convex, auth, and billing

Before editing Convex integration code, read:

- https://docs.convex.dev/llms.txt
- https://labs.convex.dev/better-auth/experimental
- https://www.better-auth.com/docs/plugins/magic-link
- https://github.com/get-convex/stripe

`bun run dev` uses Wireit to wait for the Convex service before starting the
web service. Keep secrets in the Convex deployment environment. Only public
deployment URLs use the `VITE_` prefix. Stripe checkout price IDs are
server-owned configuration; never accept an arbitrary Stripe price ID from a
browser action.

Static JWKS is an explicit deployment setup step: after configuring auth
secrets, run `bun run auth:jwks` once for each Convex deployment and refresh it
after signing-key rotation.

## Testing boundary

`web/src/lib/convex.test.tsx` pins the live-query contract (Loading, argument
switches, disposal, errors, optimistic actions). Keep the default test surface
on domain units, module integration, and runtime smokes; add a browser test
only for a named interaction or regression risk. Verify SSR and hydration on
`vp dev` with a quiet console before trusting a production bundle: Solid 2
diagnostics exist only in dev builds.

`better-auth` is held at `~1.6` because `@convex-dev/better-auth` declares a
`<1.7` peer range; widen it only after the component does.
