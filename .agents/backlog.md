---
type: Backlog
title: Deferred work
description: Known follow-up work for the shared framework templates.
---

# Deferred Work

- Wireit 0.14.13 does not recognize Bun's `npm_config_user_agent`, so TanStack
  Start task runs print one fallback warning. Remove this item when Wireit gains
  Bun detection; suppressing it today requires misleading package-manager state
  or wrapper machinery that is worse than the warning.
- `@convex-dev/better-auth` 0.12.5 exports a provider `AuthClient` union that is
  incompatible with the client inferred by its documented `convexClient()`
  setup. The TanStack template narrows only at the provider boundary; remove
  that bridge when the upstream declaration preserves the plugin tuple.
