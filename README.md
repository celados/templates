# Agent Native Framework Templates

The organization-wide GitHub source for Agent Native framework templates. Every
template is a complete standalone project materialized from `main`; the
repository does not maintain versioned template releases.

## Templates

| Template                    | Source directory                        | Runtime                                               |
| --------------------------- | --------------------------------------- | ----------------------------------------------------- |
| Astro                       | `templates/astro`                       | Astro 7, Keystatic, React 19 islands, Tailwind CSS v4 |
| Ripple TS                   | `templates/ripple-ts`                   | Ripple, TSRX, Vite+, Bun workspace                    |
| Ripple TS Browser Extension | `templates/ripple-ts-browser-extension` | Ripple, WXT, Manifest V3, Bun workspace               |
| TanStack Start              | `templates/tanstack-start`              | TanStack Start, React 19, Tailwind CSS v4             |

Create an Astro project:

```bash
vp create github:celados/templates/templates/astro \
  --package-manager bun \
  --no-agent \
  --editor vscode \
  --hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

Create a Ripple TS project:

```bash
vp create github:celados/templates/templates/ripple-ts \
  --package-manager bun \
  --no-agent \
  --editor vscode \
  --hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

Create a Ripple TS browser extension:

```bash
vp create github:celados/templates/templates/ripple-ts-browser-extension \
  --package-manager bun \
  --no-agent \
  --editor vscode \
  --hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

Create a TanStack Start project:

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

`shared/agent/`, `shared/editor/`, and `shared/tooling/` hold the common agent,
VS Code, and toolchain contracts. The Agent Native context, skills, workflow
contracts, and acceptance gates will continue to evolve in this shared layer.

## Validate

```bash
vp install
bun run install:templates
bun run check
bun run build
```
