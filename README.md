# Calque Clonesite Templates

The single GitHub source for Calque-tailored Clonesite project templates.
Every template is a complete standalone project materialized from `main`; the
repository does not maintain versioned template releases.

## Templates

| Template       | Source directory           | Runtime                                    |
| -------------- | -------------------------- | ------------------------------------------ |
| Astro          | `templates/astro`          | Astro 7, React 19 islands, Tailwind CSS v4 |
| TanStack Start | `templates/tanstack-start` | TanStack Start, React 19, Tailwind CSS v4  |

Create an Astro project:

```bash
vp create github:celados/template-calque-clonesite/templates/astro \
  --package-manager bun \
  --no-agent \
  --no-editor \
  --no-hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

Create a TanStack Start project:

```bash
vp create github:celados/template-calque-clonesite/templates/tanstack-start \
  --package-manager bun \
  --no-agent \
  --no-editor \
  --no-hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

Use the `github:` source form so Vite+ preserves the selected repository
subdirectory when it delegates the copy to degit.

## Shared files

`shared/` is the source of truth for files that must remain byte-identical
across templates. Generated copies are committed as regular files so each
GitHub subdirectory is a self-contained template on every platform.

```bash
bun run shared:sync
bun run shared:check
```

Edit the source under `shared/`, run `shared:sync`, and commit the source and
materialized copies together. Do not edit a mapped copy directly.

`shared/agent/` is reserved for the Agent Native context, skills, workflow
contracts, and acceptance gates that will be designed across both templates.

## Validate

```bash
vp install
bun run install:templates
bun run check
bun run build
```
