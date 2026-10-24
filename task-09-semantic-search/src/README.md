# Source structure

The implementation is organized by responsibility:

- `config/`: validated runtime configuration
- `errors/`: application and transport error types
- `lib/`: database, cache, embedding, and observability adapters
- `middleware/`: HTTP middleware and request lifecycle hooks
- `modules/products/`: product ingestion and persistence
- `modules/search/`: embedding, ranking, and search orchestration
- `public/demo/`: the browser-based portfolio demo

The application entry points are `app.ts` and `server.ts`. The major external concerns remain behind interfaces so they can be replaced or reused without changing the orchestration contract.
