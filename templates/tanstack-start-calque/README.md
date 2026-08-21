# TanStack Start Calque SSG Template

An SSG-first site-clone starter built with TanStack Start, React 19, Tailwind CSS
v4, Base UI, Cloudflare Workers, Bun 1.4, and Vite+. It includes deterministic
content routes, Markdown/MDX, responsive images, SEO feeds, and static-output
acceptance checks. It intentionally contains no authentication, database,
billing, or application backend.

## Create

```bash
vp create github:celados/templates/templates/tanstack-start-calque \
  --package-manager bun \
  --no-agent \
  --editor vscode \
  --hooks \
  --git \
  --no-interactive \
  -- <project-directory>
```

Copy `.env.example` to `.env` and replace `VITE_SITE_URL`. The value becomes the
origin for canonical URLs, Open Graph metadata, RSS, robots, and sitemap output.

## Commands

```bash
bun install --frozen-lockfile
bun run dev
bun run check
bun run test
bun run build
bun run preview:static
bun run test:ssg
```

`bun run build` prerenders and then audits `dist/client`. It fails when an
expected page or feed is absent, an internal link is broken, SEO metadata is
missing, or modern image output was not emitted. `preview:static` serves only
that directory; it is the closest local model of static hosting. `preview`
continues to run the full Worker build when server behavior is needed.

## Content

Add `.md` or `.mdx` files below `content/posts/`:

```md
---
title: A validated title
description: Used by listings and page metadata.
publishedAt: 2026-08-21
draft: false
---

## Content starts here
```

Frontmatter is validated before Vite starts. File paths become slugs, nested
`index.md` files collapse to their directory slug, drafts and future-dated posts
are excluded, and duplicate slugs fail the build. Set `CONTENT_BUILD_DATE` to a
`YYYY-MM-DD` value for reproducible scheduled-content builds.

`tooling/ssg-content.ts` is the deterministic route-manifest boundary. It
enumerates every post and pagination URL for TanStack Start; link crawling only
adds coverage and is not responsible for correctness. Runtime loaders return
serializable metadata and import compiled content locally, so generated pages
do not call a server function.

## Images and metadata

`ResponsiveImage` is the local-image example. `vite-imagetools` reads dimensions,
emits responsive AVIF/WebP source sets with stable hashes, and keeps `alt`
required by the component type. Replace that component if a future image plugin
owns the policy; content routes do not depend on its implementation.

Every HTML route receives canonical, description, Open Graph, and Twitter
metadata. The build also emits `/rss.xml`, `/robots.txt`, `/sitemap.xml`, and a
real `/404/index.html` document.

## Deploy

The default target is a TanStack Start Cloudflare Worker:

```bash
bun run deploy
```

For a fully static Cloudflare Worker Assets deployment:

```bash
bun run deploy:static
```

The static target uses `wrangler.static.jsonc` and publishes only `dist/client`.
The same directory can be uploaded to any host that maps clean URLs to
`<path>/index.html` and serves `404/index.html` for misses.

## Calque workflow

The installed Calque CLI owns its version-matched skill and API declaration:

```bash
calque @skill
calque @skill references/setup.md
```

Use `calque link` during capture and assembly. Generated projection files under
`src/calque/` and localized assets under `public/calque/` remain read-only. Run
`calque export` before CI or deployment.

## Boundary with Astro

This starter closes most content-site infrastructure gaps: static path
enumeration, schema-checked content, Markdown/MDX, responsive local images,
SEO/RSS/sitemap/robots, static deployment, and production-output tests. The
remaining difference is architectural: TanStack Start hydrates the React app;
it does not provide Astro's zero-JavaScript default, `.astro` component compiler,
or native islands. Do not describe this template as zero-JS.

The narrow extraction candidates for a future Vite plugin are
`tooling/ssg-content.ts`, the image policy, feed generation, and
`scripts/verify-ssg.ts`. They remain ordinary starter code until more than one
real consumer proves a shared plugin API.
