# TanStack Start Template

An organization-shared TanStack Start template for Agent Native projects
created with Vite+.

The template starts from shadcn/ui's `b0` TanStack Start preset, uses Base UI,
Tailwind CSS v4, React 19, TypeScript, Bun, and Vite+.

## Create a project

The default branch is the only template source. The template does not publish or
maintain versioned releases.

```bash
vp create github:celados/templates/templates/tanstack-start \
  --package-manager bun \
  --no-agent \
  --no-editor \
  --no-hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

## Develop the template

```bash
vp install
vp dev --port 3000
vp check
vp build
```

The Agent Native project contract and guidance are maintained as a shared layer
with the Astro template.
