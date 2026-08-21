# Calque clone application

This is a single TanStack Start application optimized for site-clone assembly. The
application source is at `src/`; Cloudflare Workers is the only deployment layer.
There is no backend, authentication, billing, database, or workspace boundary to
preserve.

For clone setup, capture, stitch, compare, CloneRun, or Calque projection work,
start with `calque @skill`. Read only the referenced files with
`calque @skill references/<name>.md`; the CLI-embedded skill and `calque.d.ts` are
version-locked to the installed Calque binary.

Calque owns `src/calque/` and `public/calque/`. Treat both as generated read-only
projection mounts. Compose or adapt them through project-owned code in
`src/sections/`, `src/components/`, and `src/routes/`. During development use
`calque link`; before CI or deployment use `calque export` so the repository is
self-contained.

Keep route assembly thin. Preserve source structure and interactions; do not
rewrite captured sections for stylistic cleanup. Run `bun run check` and
`bun run build`, then verify the actual route in a browser. A clone is complete
only when its CloneRun frontier is empty, `calque run.audit` passes, and compare
has no open rewrite error.

Before changing TanStack Start runtime behavior, read the current execution-model
and import-protection guides under https://tanstack.com/start/latest/docs/framework/react/.
Do not edit `src/route-tree.gen.ts`; `bun run routegen` owns it.
