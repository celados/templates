# Astro Template

An organization-shared Astro template for Agent Native projects created with
Vite+.

The template starts from shadcn/ui's `b0` Astro preset, uses Base UI, Tailwind
CSS v4, React 19 islands, TypeScript, Bun, and Vite+. Astro 7 keeps the runtime
on Vite 8, matching the Vite+ toolchain.

## Create a project

The default branch is the only template source. The template does not publish or
maintain versioned releases.

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
framework component diagnostics. The organization Oxfmt baseline lives in
`tooling/oxfmt.ts`; `vite.config.ts` adds Astro's Tailwind stylesheet path.

## Content management

[Keystatic](https://keystatic.com/docs/installation-astro) provides the local
CMS at `http://127.0.0.1:3000/keystatic`. Its `posts` collection writes Markdoc
files to `src/content/posts/`; Astro's content collection renders the index at
`/posts/` and one static page per entry.

```bash
vp run dev
```

The template intentionally uses Keystatic's `local` storage strategy. Local
storage requires Node.js filesystem access, so production builds set
`SKIP_KEYSTATIC=true` and omit the Admin UI/API routes while preserving all
statically rendered content. Do not present `/keystatic` as a deployed CMS on
the assets-only Cloudflare Worker. A deployed Admin UI requires a supported
Node.js host plus Keystatic GitHub or Cloud storage.

## Cloudflare Workers

This template keeps Astro's default static output and deploys `dist/` as
Cloudflare Worker static assets. Static Astro sites do not need an adapter; add
the official `@astrojs/cloudflare` adapter only when the project adopts
on-demand rendering, server islands, actions, or sessions. See Astro's
[Cloudflare deployment guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
and [Cloudflare adapter guide](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).

```bash
vp run preview:cf
vp run deploy
```

## Adding components

Add shadcn/ui components with Bun:

```bash
bunx --bun shadcn@latest add <component>
```

The Agent Native project contract and guidance are maintained as a shared layer
with the TanStack Start template.
