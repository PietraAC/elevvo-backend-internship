# Operational scripts

- `migrate.ts` applies versioned SQL migrations exactly once.
- `seed.ts` creates the deterministic catalog and real product embeddings idempotently.
- `reindex.ts` backfills stale vectors and supports `--dry-run`.
- `acceptance.ts` runs the five real-model semantic relevance scenarios.
- `benchmark.ts` measures Redis HIT latency and updates `docs/BENCHMARK.md`.
- `seed-data.ts` defines the 17-product English demonstration catalog.

Use the package scripts or `task.bat`; direct invocation is normally unnecessary.
