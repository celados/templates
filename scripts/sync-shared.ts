import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Mapping = {
  source: string;
  targets: readonly string[];
};

const root = resolve(import.meta.dir, "..");
const checkOnly = process.argv.includes("--check");
const mappings = [
  {
    source: "shared/github/workflows/ci.yml",
    targets: [
      "templates/astro/.github/workflows/ci.yml",
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
] satisfies readonly Mapping[];

let hasDrift = false;

// Remote subdirectory scaffolds must contain regular files; links to repository-level
// shared content would be broken once only one template directory is extracted.
for (const mapping of mappings) {
  const source = await readFile(resolve(root, mapping.source));

  for (const target of mapping.targets) {
    const targetPath = resolve(root, target);
    const existing = await readFile(targetPath).catch(() => null);

    if (existing?.equals(source)) {
      continue;
    }

    if (checkOnly) {
      console.error(`Shared file drift: ${target}`);
      hasDrift = true;
      continue;
    }

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, source);
    console.log(`Synced ${target}`);
  }
}

if (hasDrift) {
  console.error("Run `bun run shared:sync` and commit the materialized files.");
  process.exitCode = 1;
}
