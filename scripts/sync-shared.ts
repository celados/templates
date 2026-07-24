#!/usr/bin/env bun

import { Buffer } from "node:buffer";
import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Mapping = {
  // Framework overlays keep extracted AGENTS.md files self-contained without copying the shared base.
  appendTextSources?: readonly string[];
  source: string;
  targets: readonly string[];
};

const root = resolve(import.meta.dir, "..");
const checkOnly = process.argv.includes("--check");
const mappings = [
  {
    source: "shared/agent/AGENTS.md",
    targets: ["templates/astro/AGENTS.md", "templates/tanstack-start/AGENTS.md"],
  },
  {
    appendTextSources: ["shared/agent/ripple-ts.md"],
    source: "shared/agent/AGENTS.md",
    targets: ["templates/ripple-ts/AGENTS.md"],
  },
  {
    source: "shared/editor/vscode/extensions.json",
    targets: [
      "templates/astro/.vscode/extensions.json",
      "templates/tanstack-start/.vscode/extensions.json",
    ],
  },
  {
    source: "shared/editor/vscode/settings.json",
    targets: [
      "templates/astro/.vscode/settings.json",
      "templates/ripple-ts/.vscode/settings.json",
      "templates/tanstack-start/.vscode/settings.json",
    ],
  },
  {
    source: "shared/github/workflows/ci.yml",
    targets: [
      "templates/astro/.github/workflows/ci.yml",
      "templates/ripple-ts/.github/workflows/ci.yml",
      "templates/tanstack-start/.github/workflows/ci.yml",
    ],
  },
  {
    source: "shared/template/lib/utils.ts",
    targets: ["templates/astro/src/lib/utils.ts", "templates/tanstack-start/src/lib/utils.ts"],
  },
  {
    source: "shared/template/styles/global.css",
    targets: ["templates/astro/src/styles/global.css", "templates/tanstack-start/src/styles.css"],
  },
  {
    source: "shared/tooling/oxfmt.ts",
    targets: [
      "templates/astro/tooling/oxfmt.ts",
      "templates/ripple-ts/tooling/oxfmt.ts",
      "templates/tanstack-start/tooling/oxfmt.ts",
    ],
  },
] satisfies readonly Mapping[];

let hasDrift = false;

// Remote subdirectory scaffolds must contain regular files; links to repository-level
// shared content would be broken once only one template directory is extracted.
for (const mapping of mappings) {
  const sourcePath = resolve(root, mapping.source);
  const sourceParts = await Promise.all(
    [mapping.source, ...(mapping.appendTextSources ?? [])].map((path) =>
      readFile(resolve(root, path)),
    ),
  );
  const source = Buffer.concat(
    sourceParts.flatMap((part, index) => (index === 0 ? [part] : [Buffer.from("\n"), part])),
  );
  const sourceMode = (await stat(sourcePath)).mode & 0o777;

  for (const target of mapping.targets) {
    const targetPath = resolve(root, target);
    const existing = await readFile(targetPath).catch(() => null);
    const existingMode = await stat(targetPath)
      .then((metadata) => metadata.mode & 0o777)
      .catch(() => null);

    if (existing?.equals(source) && existingMode === sourceMode) {
      continue;
    }

    if (checkOnly) {
      console.error(`Shared file drift: ${target}`);
      hasDrift = true;
      continue;
    }

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, source);
    await chmod(targetPath, sourceMode);
    console.log(`Synced ${target}`);
  }
}

if (hasDrift) {
  console.error("Run `bun run shared:sync` and commit the materialized files.");
  process.exitCode = 1;
}
