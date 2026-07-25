# API contract package

Contract-first oRPC inputs, TypeScript output contracts, and a compiled client
factory for this Worker. Inputs use Valibot for runtime validation. Outputs use
oRPC's `type<Output>()` helper and are intentionally not runtime-validated.

Rename the package to `@celados/<project>-api` before publishing. Registry
authentication belongs at the workspace root and is configured through the
project's installed `publish-package` skill.
