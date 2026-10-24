# Test structure

- `unit/` covers canonical text, hashing, query validation, vectors, cache states, and single-flight behavior.
- `http/` verifies health, search validation, request IDs, timing headers, catalog safety, and demo assets.
- `integration/` verifies the real pgvector schema, cosine ordering, inactive filtering, update lifecycle, Redis TTL, and catalog versioning.
- The real-model relevance suite lives in `scripts/acceptance.ts` so it can run separately from fast tests.

Run `task.bat test` for unit, HTTP, and integration suites. Run `task.bat verify` to include the production build and all five real-model relevance scenarios.
