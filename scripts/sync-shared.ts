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
    source: "shared/agent/install-skills.mjs",
    targets: [
      "templates/cloudflare-worker/scripts/install-skills.mjs",
      "templates/solid-browser-extension/scripts/install-skills.mjs",
      "templates/solid-start/scripts/install-skills.mjs",
      "templates/tanstack-start/scripts/install-skills.mjs",
      "templates/tanstack-start-calque/scripts/install-skills.mjs",
      "templates/tanstack-start-multisite/scripts/install-skills.mjs",
    ],
  },
  {
    appendTextSources: ["shared/agent/solid-browser-extension.md"],
    source: "shared/agent/AGENTS.md",
    targets: ["templates/solid-browser-extension/AGENTS.md"],
  },
  {
    appendTextSources: ["shared/agent/solid-start.md", "shared/agent/convex.md"],
    source: "shared/agent/AGENTS.md",
    targets: ["templates/solid-start/AGENTS.md"],
  },
  {
    appendTextSources: ["shared/agent/tanstack-start.md", "shared/agent/convex.md"],
    source: "shared/agent/AGENTS.md",
    targets: ["templates/tanstack-start/AGENTS.md"],
  },
  {
    appendTextSources: ["shared/agent/tanstack-start-calque.md"],
    source: "shared/agent/AGENTS.md",
    targets: ["templates/tanstack-start-calque/AGENTS.md"],
  },
  {
    appendTextSources: ["shared/agent/tanstack-start-multisite.md", "shared/agent/convex.md"],
    source: "shared/agent/AGENTS.md",
    targets: ["templates/tanstack-start-multisite/AGENTS.md"],
  },
  {
    source: "shared/agent/convex-directory.md",
    targets: [
      "templates/solid-start/convex/AGENTS.md",
      "templates/tanstack-start/convex/AGENTS.md",
      "templates/tanstack-start-multisite/convex/AGENTS.md",
    ],
  },
  {
    source: "shared/agent/convex-guidelines.md",
    targets: [
      "templates/solid-start/convex/_generated/ai/guidelines.md",
      "templates/tanstack-start/convex/_generated/ai/guidelines.md",
      "templates/tanstack-start-multisite/convex/_generated/ai/guidelines.md",
    ],
  },
  {
    appendTextSources: ["shared/agent/cloudflare-worker.md"],
    source: "shared/agent/AGENTS.md",
    targets: ["templates/cloudflare-worker/AGENTS.md"],
  },
  {
    source: "shared/editor/vscode/extensions.json",
    targets: [
      "templates/cloudflare-worker/.vscode/extensions.json",
      "templates/solid-browser-extension/.vscode/extensions.json",
      "templates/solid-start/.vscode/extensions.json",
      "templates/tanstack-start/.vscode/extensions.json",
      "templates/tanstack-start-calque/.vscode/extensions.json",
      "templates/tanstack-start-multisite/.vscode/extensions.json",
    ],
  },
  {
    source: "shared/editor/vscode/settings.json",
    targets: [
      "templates/cloudflare-worker/.vscode/settings.json",
      "templates/solid-browser-extension/.vscode/settings.json",
      "templates/solid-start/.vscode/settings.json",
      "templates/tanstack-start-calque/.vscode/settings.json",
      "templates/tanstack-start/.vscode/settings.json",
      "templates/tanstack-start-multisite/.vscode/settings.json",
    ],
  },
  {
    source: "shared/skills/cloudflare-worker/manifest.json",
    targets: ["templates/cloudflare-worker/.agents/skills/manifest.json"],
  },
  {
    source: "shared/skills/solid-start/manifest.json",
    targets: [
      "templates/solid-browser-extension/.agents/skills/manifest.json",
      "templates/solid-start/.agents/skills/manifest.json",
    ],
  },
  {
    source: "shared/skills/tanstack-start/manifest.json",
    targets: [
      "templates/tanstack-start/.agents/skills/manifest.json",
      "templates/tanstack-start-calque/.agents/skills/manifest.json",
      "templates/tanstack-start-multisite/.agents/skills/manifest.json",
    ],
  },
  {
    source: "shared/github/workflows/ci.yml",
    targets: [
      "templates/cloudflare-worker/.github/workflows/ci.yml",
      "templates/solid-start/.github/workflows/ci.yml",
      "templates/tanstack-start-calque/.github/workflows/ci.yml",
      "templates/tanstack-start/.github/workflows/ci.yml",
      "templates/tanstack-start-multisite/.github/workflows/ci.yml",
    ],
  },
  {
    source: "shared/template/lib/utils.ts",
    targets: [
      "templates/tanstack-start-calque/src/lib/utils.ts",
      "templates/tanstack-start/web/src/lib/utils.ts",
      "templates/tanstack-start-multisite/shared/lib/utils.ts",
    ],
  },
  {
    source: "shared/template/styles/global.css",
    targets: [
      "templates/tanstack-start-calque/src/styles.css",
      "templates/tanstack-start/web/src/styles.css",
      "templates/tanstack-start-multisite/shared/styles.css",
    ],
  },
  {
    source: "shared/tooling/lint.ts",
    targets: [
      "templates/solid-browser-extension/tooling/lint.ts",
      "templates/solid-start/tooling/lint.ts",
      "templates/tanstack-start-calque/tooling/lint.ts",
      "templates/tanstack-start/tooling/lint.ts",
      "templates/tanstack-start-multisite/tooling/lint.ts",
    ],
  },
  {
    source: "shared/tooling/oxfmt.ts",
    targets: [
      "templates/cloudflare-worker/tooling/oxfmt.ts",
      "templates/solid-browser-extension/tooling/oxfmt.ts",
      "templates/solid-start/tooling/oxfmt.ts",
      "templates/tanstack-start-calque/tooling/oxfmt.ts",
      "templates/tanstack-start/tooling/oxfmt.ts",
      "templates/tanstack-start-multisite/tooling/oxfmt.ts",
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
