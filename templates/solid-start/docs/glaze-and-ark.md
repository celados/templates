---
type: Playbook
title: Adopting Glaze and Solid Ark
description: >
  How a project grown from this template takes on @celados/glaze components and
  @celados/solid-ark primitives, and what the browser extension's content
  scripts need beyond what web/ does.
when: >
  A feature needs rich interaction components (dialogs, menus, comboboxes,
  motion) in web/ or extension/, and the template's plain StyleX recipes are no
  longer enough.
status: guidance # guidance | adopted
generated: { by: claude-code/opus-5, at: 2026-09-19T00:00:00Z }
---

# Adopting Glaze and Solid Ark

The template ships StyleX with the web app's tokens (`web/src/styles/tokens.stylex.ts`),
shared by `web/` and `extension/`. It does **not** depend on Glaze or Solid Ark:
adopt them when a feature needs them, following this guide. Once adopted,
move the constraints you rely on into the owning `AGENTS.md` (root for `web/`,
`extension/AGENTS.md` for the extension). A guide the agent never loads doesn't protect anything.

- [Glaze](https://github.com/celados/glaze): StyleX recipes, motion and Solid 2
  components, shipped as uncompiled StyleX source.
- [Solid Ark](https://github.com/celados/solid-ark): headless Ark UI bindings
  for Solid 2 on Zag v2 machines, with styles left to the consumer.

## Choosing: package or local copy

|                 | Package                                                                | Local copy                                      |
| --------------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| Fits when       | Many components used as-is                                             | A few components, or ones that need adapting    |
| Cost            | Exact pre-release pins shared with the template's Solid runtime        | You own the copy; upstream fixes arrive by hand |
| Content scripts | Only components that satisfy [the constraints below](#content-scripts) | Adapt freely (px units, portal mounts)          |

The two mix: take Solid Ark as a package (it is headless, so it carries no
styling assumptions) and copy the Glaze recipes you need to adapt.

### As a package

Follow the upstream contracts rather than a copy of them:
Glaze's README, "Downstream package contract", and Solid Ark's README, "Consume the package". The points that
touch this template:

- Both come from the `@celados` scope on `https://npm.celados.com`
  (`publish-package` skill). Add them with `bun add`, pinned exactly.
- Solid core, web and signals must resolve to the one rc version the template pins. The
  upstream `pnpm-workspace.yaml` override becomes an `overrides` entry for
  `@solidjs/signals` in every `package.json` that installs them. `extension/`
  has its own.
- Glaze ships StyleX source, so the compiler must transform it inside
  `node_modules`. `@stylexjs/unplugin` finds packages that depend on
  `@stylexjs/stylex` and excludes them from dependency optimization.
  `viteOptions(rootDir)` from `@celados/glaze/stylex` matches the options in
  `web/vite.config.ts` and `extension/stylex.config.ts`.
- `@celados/glaze/reset.css` and `web/src/styles/reset.css` both claim the
  `reset` layer; keep one.

### As a local copy

Copy the component and its `*.stylex.ts` recipe into the consumer (`web/src/`
or `extension/src/ui/`), keep the upstream path and commit in a header
comment, and rewrite it against the local tokens. Glaze's
[provenance notes](https://github.com/celados/glaze/blob/main/docs/provenance.md)
list vendored licenses that travel with copied code.

## Extension pages

Side panel, popup and options pages are ordinary documents. Glaze and Solid Ark
behave there as they do in `web/`. StyleX appends all of a build's rules to one
CSS asset, and WXT builds every HTML page in one build. Each page imports
`web/src/styles/reset.css` as the side panel does, so Vite emits one shared CSS
asset that every page links. A page that imports different CSS can end up with
its own asset and no StyleX rules. Checked with a second page on WXT 0.21.

## Content scripts

Content-script UI renders inside a Shadow Root on someone else's page
(`createShadowRootUi`, `cssInjectionMode: 'ui'`). What already holds:

- CSS imported by the entrypoint reaches the Shadow Root through WXT, which
  rewrites `:root` to `:host` (so `defineVars` tokens resolve) and moves
  `@property` and `@font-face` rules into the document, where they register. The shadow tree ignores them.
  Source: `wxt/dist/utils/content-script-ui/shadow-root.mjs` (0.21). The e2e
  test pins the token half (`expectTokensInShadowRoot`).

What a component must satisfy before it goes into a content script:

1. **No `rem`.** The host page owns the root font size. Glaze uses `rem` in
   several recipes and components. Find them with
   `rg -l "[0-9.]rem['\" ,]" src/styles src/solid` in the Glaze checkout. Copy
   and convert those to px, or keep them out of content scripts.
2. **No runtime style injection into the document.** Styles appended to
   `document.head` bypass WXT, so they never reach the Shadow Root and they
   leak into the host page. Glaze's `attachBorderBeam` does this.
3. **Portals mount inside the Shadow Root.** Solid's `<Portal>` mounts on
   `document.body` by default, which leaves the shadow tree. The UI then loses
   its styles and event isolation. Pass the UI container that WXT's `onMount`
   receives. Some Glaze components expose `portal`/`portalRoot` for this;
   others hard-code the default, and `project-folder`'s motion appends nodes
   to `document.body` directly. Those need a local copy.
4. **Zag sees the shadow root.** Wrap the content-script tree in Solid Ark's
   `EnvironmentProvider` with the shadow root (`onMount`'s second argument),
   so focus trapping, dismissal and outside-click checks query the right tree
   ([Ark environment docs](https://ark-ui.com/docs/utilities/environment)).
   This template has not verified it yet. Add an e2e interaction when you
   adopt it.
5. **Fonts and colors are explicit.** WXT resets the host with
   `:host { all: initial }`, so nothing inherits from the page. Set
   `font-family` and color on the component root, as `extension/src/ui/ui.ts`
   `panel` does.
