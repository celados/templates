# Repository Contract

## Purpose

This repository is the organization-wide source for Agent Native framework
templates. `main` is the only published template source. Do not add package
registry publishing, release tags, or a parallel version-maintenance workflow.

Every directory under `templates/` must remain a complete standalone project.
`vp create github:celados/templates/templates/<name>` extracts only that
subdirectory, so a generated project cannot depend on files outside its own
template directory.

## Ownership Model

Shared files use a source-to-materialized-copy model:

```text
shared/<domain>/<file>
        │
        └── scripts/sync-shared.ts
                ├── templates/astro/<target>
                └── templates/tanstack-start/<target>
```

- `shared/` is the source of truth for content that must remain byte-identical
  across templates.
- Mapped files inside `templates/` are committed regular files, not symlinks.
  This is required because remote subdirectory extraction does not include the
  repository-level shared directory.
- Never edit a mapped target directly. Edit its source under `shared/`, run
  `bun run shared:sync`, and commit the source and all materialized targets
  together.
- `bun run shared:check` fails on content or executable-mode drift. The exact
  mapping table lives in `scripts/sync-shared.ts`; do not infer mappings from
  similar filenames.

For example, `shared/tooling/oxfmt.ts` owns the common formatter policy, while
`templates/tanstack-start/tooling/oxfmt.ts` is its self-contained materialized
copy. Each framework's `vite.config.ts` imports that local copy and adds only
framework-specific values such as its Tailwind stylesheet path.

## Layout

- `templates/astro/`: standalone Astro template and Astro-specific runtime,
  build, and Cloudflare static-assets configuration.
- `templates/tanstack-start/`: standalone TanStack Start template and its
  Cloudflare Workers SSR configuration.
- `shared/agent/`: agent instructions materialized into every template.
- `shared/editor/`: common editor configuration.
- `shared/github/`: common template-level GitHub workflows.
- `shared/template/`: shared application source and styles.
- `shared/tooling/`: reusable toolchain policy imported by each template.
- `scripts/`: repository-maintenance programs. Its nested `AGENTS.md` adds the
  executable Bun-script rule.
- Root `package.json`, `vite.config.ts`, and `.github/workflows/ci.yml`:
  aggregate-repository orchestration and validation, not template runtime
  configuration.

Empty shared domains are not placeholders. Delete an empty directory unless a
tracked file or an immediate contract requires it.

## Change Routing

Choose the narrowest ownership surface:

1. If behavior and bytes must be identical across templates, put the source in
   `shared/`, add explicit targets to `scripts/sync-shared.ts`, and materialize
   it.
2. If the policy is shared but parameters differ by framework, put the common
   typed module in `shared/` and keep a shallow framework-specific composition
   in each template. Oxfmt is the reference example.
3. If behavior belongs to one framework, edit only that template. Do not add a
   shared abstraction merely because two files look temporarily similar.
4. When adding a new template, make it standalone first, then add it to every
   applicable shared mapping, root install/check/build orchestration, the root
   README, and CI validation.

Do not introduce compatibility shims for retired layouts or template names.
Change mappings and consumers together.

## Template Defaults

- Templates include their own `AGENTS.md`, so canonical create commands keep
  `--no-agent`; Vite+ must not replace the template-authored agent contract.
- Canonical creation enables `--editor vscode`, `--hooks`, `--git`, Bun, and
  non-interactive execution. Keep the exact user-facing commands in the root
  and template READMEs.
- Vite+ owns package management, formatting, linting, staged checks, and the
  aggregate task runner. Framework CLIs continue to own framework-specific
  lifecycle behavior.
- Oxfmt options belong in the Vite+ `fmt` block, not a competing
  `.oxfmtrc.jsonc`. Keep the common options in `shared/tooling/oxfmt.ts` and
  compose them from each template's `vite.config.ts`.
- Astro remains static by default and deploys `dist/` as Cloudflare Worker
  static assets. Do not add the Cloudflare adapter until on-demand rendering or
  another Worker runtime feature is actually required.
- TanStack Start uses the Cloudflare Vite plugin for its SSR environment. Do
  not copy that plugin into the static Astro template for symmetry.

## Generated and Ignored Artifacts

- Do not commit `node_modules/`, `dist/`, `.astro/`, or `.wrangler/` output.
- TanStack Router may regenerate `src/route-tree.gen.ts`. Do not hand-format
  it; the template intentionally excludes it from formatter and lint drift.
- `wrangler types` owns `worker-configuration.d.ts`. Inspect generated changes
  and commit the file only when the template's binding/type contract requires
  it; never hand-edit generated declarations.
- Shared materialized files are generated but intentionally committed because
  standalone subdirectory extraction requires them.

## Required Workflow

Install and validate the aggregate repository with:

```bash
vp install
bun run install:templates
bun run check
bun run build
```

After changing a shared source, run `bun run shared:sync` before validation.
`bun run check` covers root checks, shared drift, and both template checks;
`bun run build` builds both templates.

For a framework-local investigation, run scripts from that template directory
or through `bun run --cwd templates/<name> <script>`. Astro lifecycle commands
must go through its package scripts (`vp run <script>`), while TanStack Start's
Vite lifecycle may use `vp dev`, `vp check`, and `vp build` directly.

After changing template extraction, dependencies, editor/agent setup, hooks, or
shared materialization, smoke-test the published GitHub subdirectory with the
canonical `vp create` command and run the generated project's checks. A local
build alone does not prove the remote template contract.

## Sources of Truth

Read local implementation before changing policy:

- `README.md`: supported templates and canonical create commands.
- `scripts/sync-shared.ts`: complete shared-file mapping and drift semantics.
- `package.json`: aggregate commands.
- `.github/workflows/ci.yml`: remote acceptance gate.
- `templates/*/README.md`, `package.json`, and `vite.config.ts`: framework-local
  runtime and validation contracts.

Use current official documentation for tool behavior that can drift:

- Vite+ create: https://viteplus.dev/guide/create
- Vite+ format: https://viteplus.dev/guide/fmt
- Vite+ hooks: https://viteplus.dev/guide/commit-hooks
- Astro on Cloudflare: https://docs.astro.build/en/guides/deploy/cloudflare/
- Cloudflare Vite plugin: https://developers.cloudflare.com/workers/vite-plugin/
