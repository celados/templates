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

# Solid 2 Start + Convex

This is one full-stack application with one root `package.json`. `web/` owns
the Solid 2 start-mode runtime (SSR on Cloudflare Workers); `convex/` is a
peer, application-scoped backend module. Neither is a separate package or
workspace. `extension/` is the removable companion browser extension; it keeps
its own `package.json` for WXT, and its `AGENTS.md` owns its contract and the
removal checklist. The runtime set is `solid-js`, `@solidjs/web`,
`@solidjs/vite-plugin`, `@solidjs/router`, and `@solidjs/meta`; never introduce
`@solidjs/start`, Vinxi, or Nitro — released SolidStart runs on Solid 1.

## Before editing `web/`

Solid 2 is not Solid 1 and not React. Read
`node_modules/solid-js/CHEATSHEET.md` before editing anything under `web/`;
1.x and React priors compile here and then misbehave at runtime. The
`solid2` skill covers the same reset plus state-design patterns.
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
- `web/src/lib/convex.ts` is the only entry to Convex queries. Keep Convex
  function selection typed through `convex/_generated/api`. A query renders on
  the server with the visitor's identity and continues live after hydration:
  `web/src/middleware.ts` hangs a per-request reader on `locals.convex`
  (`web/src/lib/convex-server.ts`). `querySource` reads one HTTP snapshot
  through it on the server, never a socket, and subscribes in the browser; the
  browser stream carries Solid's `solid.LiveSource` brand, so any primitive
  returning it (memo, projection, store) takes over after hydration without
  `ssrSource`. `ssrSource: 'client'` opts a source out of the server render.
  A read under `<Loading>` streams behind the shell; outside one it holds the
  document for the round trips. `extension/` bundles this module too, so keep
  it free of router and Cloudflare imports. A live source must not subscribe
  before its first pull: hydrating a server-rendered read, Solid traces the
  compute and pulls once under a mock `Promise` (`querySource` subscribes
  inside the first `next()` executor for that reason).
- `web/src/lib/auth.ts` owns Better Auth. Auth HTTP traffic is proxied
  same-origin through `web/src/routes/api/auth/[...all].ts` to the Convex site,
  so cookies stay first-party. `user$` renders on the server like any query;
  without a session cookie it answers `null` without asking Convex, so
  anonymous renders cost nothing. The browser client calls `setAuth` at
  construction, before any subscription, so no query answers anonymously first.
- Styling is StyleX. Tokens live in `web/src/styles/*.stylex.ts` and are
  shared with `extension/`; read the `stylex-authoring` skill before adding
  themes or variables. Glaze and Solid Ark are not installed; when a feature
  needs rich interaction components, follow `docs/glaze-and-ark.md`.
- Errors Solid handles (boundary fallbacks, rejected `Loading` fragments) reach
  only the runtime error hooks: `web/src/lib/client-errors.ts` and
  `web/src/instrument.ts`. Wire a monitor there, not per `Errored` fallback.
  The build is `observe: true`, so their paths name components; see
  https://v2.solidjs.com/guides/observability
- `@solidjs/diagnostics` is a dev dependency, so `vite dev` serves `/__solid/diagnostics`: POST `{"method":"begin"}`, drive the page, POST `{"method":"end"}` for a structured artifact (diagnostic codes, re-runs, holds). The fix for each code is in `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`; the agent loop is in `node_modules/@solidjs/diagnostics/skills/agent-loops/SKILL.md`.

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

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
