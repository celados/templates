# Astro Calque Clonesite Template

An independent Git template for projects created with Vite+ and tailored to the
Calque clonesite workflow.

The template starts from shadcn/ui's `b0` Astro preset, uses Base UI, Tailwind
CSS v4, React 19 islands, TypeScript, Bun, and Vite+. Astro 7 keeps the runtime
on Vite 8, matching the Vite+ toolchain.

## Create a project

The default branch is the only template source. The template does not publish or
maintain versioned releases.

```bash
vp create github:celados/template-astro-calque-clonesite \
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
vp run dev
vp run check
vp run build
```

Astro owns its runtime and build lifecycle, so use `vp run` for the scripts
instead of invoking `vp dev` or `vp build` directly. Vite+ owns dependency
management, formatting, linting, and TypeScript checks; `astro check` covers
framework component diagnostics.

## Adding components

Add shadcn/ui components with Bun:

```bash
bunx --bun shadcn@latest add <component>
```

The Agent Native project contract and guidance will be designed as a separate
layer shared with the TanStack Start template.
