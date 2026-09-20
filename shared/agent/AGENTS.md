<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

After completing a meaningful development stage, if the project defines
`deploy:temporary`, use it when an online preview would help verify or share the
result. Return the deployment URL and the time-sensitive Cloudflare claim URL
to the user.

<!--VITE PLUS END-->

## Dead code

`bun run check` ends with `fallow dead-code`, a project-graph pass that finds
what a file-level linter cannot: files no entry point reaches, exports with no
consumer, and dependencies that are declared but unused or used but undeclared.
Fix what it reports; do not reach for a suppression first.

When a finding is wrong, the cause is almost always that something reaches the
code through a mechanism the static graph cannot follow — a generated route
tree, a runtime glob, a string in a config. Say so in `.fallowrc.jsonc` with the
narrowest key that fits (`entry`, `dynamicallyLoaded`, `ignoreDependencies`,
`ignoreUnresolvedImports`) and a comment naming the mechanism.
`fallow-plugin-viteplus.jsonc` already covers the toolchain's own conventions.

Fallow's own skill ships inside the pinned package at
`node_modules/fallow/skills/fallow/SKILL.md`, with references beside it. Read it
when a task needs more of the tool than `dead-code` — tracing why a symbol is
reported, scoping a run to changed files, the JSON envelopes. It is not
installed as a project skill because the package copy cannot drift from the
binary the lockfile pins.
