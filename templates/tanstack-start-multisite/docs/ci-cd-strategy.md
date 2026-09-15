---
type: Reference
title: Target-aware CI/CD strategy
description: >
  Proposed delivery strategy for validating and deploying only the affected
  sites and shared services in a multi-site product.
status: proposed # proposed | accepted | superseded
version: 0.1
generated: { by: codex/gpt-5, at: 2026-08-05T13:49:05+08:00 }
tags: [ci, cd, multi-site, github-actions, cloudflare-workers]
---

# Target-aware CI/CD strategy

## Status and intent

This document proposes the default CI/CD model for projects created from this
starter. It is a reference architecture, not a description of the current
workflow and not an implementation requirement until accepted.

The goal is to preserve the starter's shared-product model while avoiding an
unnecessary build or deployment of every site after an isolated change.
Optimization must not create a path where a failed or previously skipped
deployment is silently forgotten.

## Scope

This strategy applies when one product has:

- independently deployable site adapters under `sites/<site>/`;
- product-wide browser and server modules under `shared/`;
- a shared Convex backend under `convex/`; and
- one root dependency and tooling graph.

It does not make unrelated products suitable for consolidation. Products that
only share visual components but have different identity, data, security,
ownership, or release lifecycles should retain separate deployment boundaries.
A shared source repository is not, by itself, a reason to share a pipeline or
failure domain.

## Core model

Treat the repository as a source organization boundary and each independently
releasable runtime as a **deployment target**.

The initial target set is:

| Target       | Kind           | Runtime owner  |
| ------------ | -------------- | -------------- |
| `site:alpha` | Site           | `sites/alpha/` |
| `site:beta`  | Site           | `sites/beta/`  |
| `backend`    | Shared service | `convex/`      |

Delivery behavior comes from three explicit contracts:

1. **Target registry** — the complete set of deployable targets.
2. **Input graph** — the transitive repository inputs that can change each
   target or its compatibility.
3. **Deployment ledger** — the last successfully deployed revision or input
   fingerprint for each target and environment.

The target registry and input graph must have one repository-owned source of
truth. CI workflows, local commands, and deployment workflows should consume
that source instead of maintaining separate path lists in YAML.

## Change classification

The starting input graph should classify changes as follows:

| Changed input                              | Validate                           | Candidate deployments                   |
| ------------------------------------------ | ---------------------------------- | --------------------------------------- |
| `sites/alpha/**`                           | Alpha                              | Alpha                                   |
| `sites/beta/**`                            | Beta                               | Beta                                    |
| `shared/**`                                | Every consuming site               | Every consuming site                    |
| `convex/**`                                | Backend and consumer compatibility | Backend                                 |
| Root dependencies and shared build tooling | All targets                        | Targets whose fingerprints changed      |
| Target-specific Wrangler configuration     | Owning site                        | Owning site                             |
| Documentation and agent instructions       | Documentation policy only          | None                                    |
| Delivery graph or detector                 | All targets                        | None unless product inputs also changed |

Validation and deployment are deliberately different sets. A backend contract
change may require every consumer to typecheck without changing any site
artifact. Conversely, a shared UI change enters every consuming site artifact
and therefore affects every such site deployment.

An unclassified repository path must fail closed by selecting every target.
This conservative default prevents a newly introduced directory from bypassing
validation or deployment before the input graph is updated.

Generated files and local build output must not be treated as authoritative
inputs. Route trees, Worker types, and other generated artifacts must be
recreated explicitly on a clean runner before validation.

## CI policy

### Pull requests

For a pull request, compute affected targets from the merge base of the base
branch through the proposed revision. The pipeline should:

1. run one always-present detection job;
2. emit a JSON matrix of affected validation targets;
3. run target-local code generation, typechecking, tests, and builds through
   that matrix;
4. run shared checks once rather than once per target; and
5. finish with one stable required-check summary, including when the target
   matrix is empty.

The workflow itself should remain broadly triggered. Workflow-level path
filters duplicate the target graph, and a skipped required workflow can remain
pending on a pull request. A successful no-op detection result is clearer than
an absent check.

Changes to the target registry, detector, root dependency graph, or shared
tooling must select all targets. A manual full-validation entry point should
also remain available to audit the declared graph against a clean build.

### Main branch

Main-branch CI should use the same target registry and clean-runner contract.
It may reuse the affected set produced for delivery, but validation success
must be recorded independently from deployment success.

## CD policy

### Compare against deployed state

Production delivery must not decide from `HEAD^`, the previous workflow run,
or only the commits in the latest push. Those ranges describe recent source
activity, not what is currently deployed.

Each target and environment must instead compare the desired revision against
its own last successful deployment state. This preserves pending work after a
partial failure. For example, if Alpha fails to deploy and a later commit only
changes Beta, Alpha remains affected until it eventually deploys successfully.

The minimum ledger records a successful commit per target. The preferred
ledger records a deterministic input fingerprint per target:

```text
fingerprint(site:alpha) = hash(
  sites/alpha/**,
  shared/**,
  root dependencies,
  relevant build tooling
)
```

A content fingerprint avoids deployment after changes that do not alter a
target's transitive inputs and can recognize a complete revert. Fingerprints
must use tracked source inputs in stable order; caches, generated output,
timestamps, and runner-specific paths must not participate.

The ledger advances only after the target has deployed and passed its required
post-deployment verification. A failed build, deploy, or smoke check must leave
the previous successful state intact.

### Build once and promote

An affected site should be built once. The exact validated artifact should be
promoted to deployment rather than rebuilt inside the deployment job. This
keeps code generation, dependency resolution, and build environment drift from
creating a production artifact different from the one CI accepted.

Artifacts must be named by target and revision or fingerprint. Deployment must
reject an artifact whose target, revision, or environment metadata does not
match the requested release.

### Ordering

Targets that do not depend on the same mutable release step may deploy in
parallel. When a revision changes both the backend and sites:

1. validate the backend and all affected consumer contracts;
2. deploy the backward-compatible backend change;
3. deploy only site artifacts whose fingerprints changed; and
4. run target-local smoke checks before advancing each ledger entry.

Breaking online-service changes require an explicit migration plan, normally
an expand-and-contract sequence. Consolidating source code does not remove the
need to preserve compatibility while old and new site revisions coexist.

### Concurrency and recovery

Concurrency must be scoped per deployment target and environment, such as
`production-alpha`, rather than to the entire repository. One site's slow or
failed deployment should not block an unrelated site.

Production jobs should serialize writes to the same target. A newer run may
replace pending work only when the deployment ledger still guarantees that all
desired inputs are included; cancellation must never be used as a substitute
for state reconciliation.

Every deployment target must support:

- an explicit force-deploy input for operational recovery;
- an observable no-op result when its fingerprint already matches production;
- a target-local smoke check; and
- a readback showing which revision or fingerprint is live.

## Declared configuration and runtime state

Repository change detection covers declared source and configuration only.
Secrets, provider-side environment variables, DNS, OAuth registrations, and
other mutable runtime state are not visible in a Git diff.

Keep these concerns separate:

- declared non-secret configuration belongs in the relevant target's input
  graph;
- secrets and provider-managed state use an explicit operational workflow;
- an operational change must name its affected targets and verification; and
- rotating a secret must not require a meaningless source commit merely to
  trigger deployment.

Where a runtime-state change requires a new artifact or Worker version, the
operational workflow should invoke the same target deployment path with an
explicit force reason.

## Suggested workflow shape

```text
detect
├── validate-shared
├── validate-targets[target...]
└── plan-delivery
    ├── deploy-backend
    └── build-sites[site...]
        └── deploy-sites[site...]
            └── smoke-sites[site...]
                └── record-success[site...]
```

The detector should emit machine-readable data rather than shell booleans:

```json
{
	"validate": ["backend", "site:alpha", "site:beta"],
	"deploy": ["backend", "site:alpha", "site:beta"]
}
```

An empty array is a successful no-op. Invalid target names, malformed output,
or incomplete classification are hard failures.

## Migration guidance for existing projects

Before moving an existing project into this architecture, confirm that its
sites intentionally share:

- product identity and ownership;
- user and authorization model;
- application data and backend lifecycle;
- billing semantics; and
- acceptable release and incident blast radius.

If those answers are not consistently yes, prefer a shared template, library,
or generated project convention over one multi-site runtime repository.

For an eligible migration, establish deployment targets and baseline ledger
entries before redirecting production traffic. Migration is complete only when
each target can build, deploy, verify, and recover independently.

## Adoption sequence

1. Add a typed target registry and conservative path-based detector.
2. Split aggregate validation into shared checks and target-local commands.
3. Drive CI jobs from the detector's dynamic matrix.
4. Record last successful deployment state independently for every target and
   environment.
5. Build once, promote the same artifact, smoke-test, and then advance the
   ledger.
6. Replace commit-based comparison with deterministic input fingerprints when
   the path graph is stable.

Do not introduce a second monorepo task system solely for affected detection.
The starter already has one root package and a Wireit task graph; a small typed
detector is the lower-maintenance default. Re-evaluate a package-aware build
system only if the repository later acquires a genuinely complex package graph
or requires cross-runner remote build caching.

## Acceptance criteria

The strategy is correctly implemented when all of the following hold:

- an Alpha-only source change does not build or deploy Beta;
- a shared frontend change validates and deploys every consuming site;
- a backend-only compatible change validates consumers but deploys no unchanged
  site artifact;
- a failed target deployment remains pending across later unrelated commits;
- a documentation-only change produces a successful no-op delivery plan;
- an unknown source path selects all targets;
- a deployed artifact is byte-identical to the validated artifact;
- each target's live revision or fingerprint can be read back; and
- changing runtime secrets or provider configuration has an explicit path that
  does not depend on a dummy source commit.

## Primary references

- [GitHub Actions workflow syntax: path filters](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore)
- [GitHub Actions: running job variations with a matrix](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [GitHub Actions: deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Cloudflare Workers: builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Cloudflare Workers: versions and deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/)
