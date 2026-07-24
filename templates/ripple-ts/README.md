# Ripple TS Template

An organization-shared Ripple TS template for small applications that may also
ship reusable TSRX component packages.

## Create a project

The default branch is the only template source. The template does not publish or
maintain versioned releases.

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

## Work in the project

```bash
vp install
vp run dev
vp run check
vp run build
```

`apps/web` owns the browser application and mount lifecycle. `packages/ui` owns
reusable named TSRX components and exposes a deliberate public package boundary.
The app consumes that package through the Bun workspace.

## Publish a component package

The UI package ships source `.tsrx` files so the consuming Ripple application's
Vite graph owns compilation. Consumers must use the Ripple Vite plugin; this is
not a precompiled package for unrelated UI runtimes.

Before the first publish:

1. Rename `@app/ui` to a package scope you own.
2. Update the dependency name and import in `apps/web`.
3. Add repository and license metadata required by your registry.
4. Inspect the package and run a dry publish.

```bash
bun run pack:check
bun publish --cwd packages/ui --dry-run
```

Publish only after the generated project passes `vp run check` and
`vp run build`.

## Sources

- Ripple documentation: https://www.ripple-ts.com/llms.txt
- TSRX documentation: https://tsrx.dev/llms.txt
- Vite+ monorepo guide: https://viteplus.dev/guide/monorepo
