# TanStack Start Calque Clonesite Template

An independent Git template for projects created with Vite+ and tailored to the
Calque clonesite workflow.

The template starts from shadcn/ui's `b0` TanStack Start preset, uses Base UI,
Tailwind CSS v4, React 19, TypeScript, Bun, and Vite+.

## Create a project

The default branch is the only template source. The template does not publish or
maintain versioned releases.

```bash
vp create github:celados/template-tanstack-start-calque-clonesite \
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

The AI-native template contract and its agent guidance are intentionally outside
this baseline and will be designed separately.
