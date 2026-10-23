# Source structure

This directory currently contains placeholders only. The implementation will be organized by responsibility:

- `config/`: validated runtime configuration
- `errors/`: application and transport error types
- `lib/`: database, cache, embedding, and observability adapters
- `middleware/`: HTTP middleware and request lifecycle hooks
- `modules/products/`: product ingestion and persistence
- `modules/search/`: embedding, ranking, and search orchestration
- `public/demo/`: the future browser-based portfolio demo

Files will be added incrementally as each behavior is implemented and tested.
