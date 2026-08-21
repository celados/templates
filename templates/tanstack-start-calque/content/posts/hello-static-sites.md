---
title: Static pages without hidden runtime dependencies
description: A Markdown example that is validated and prerendered during the build.
publishedAt: 2026-08-20
---

## The build is the contract

Every public content path is enumerated before TanStack Start begins prerendering.
Link crawling remains useful, but it is not responsible for correctness.

- Frontmatter is validated with Valibot.
- The final HTML is checked for broken internal links.
- Client navigation reads bundled content instead of calling a server function.
