# Task 09 — Semantic Search API

**Status:** Complete and verified locally.

This project is a complete backend service that combines PostgreSQL, real vector embeddings, semantic product search, and Redis caching. It includes a screenshot-ready Semantic Search Lab, deterministic seed data, automated quality checks, and a measured warm-cache performance report.

## Objective

This search API understands the meaning of a query instead of relying only on exact keyword matches. It stores product data and embeddings in PostgreSQL, ranks results by semantic similarity, and caches repeated searches in Redis.

## Capabilities

- Product ingestion and validation
- Local text embedding generation
- Vector storage in PostgreSQL with `pgvector`
- Semantic similarity search
- Redis caching with a defined expiration policy
- Health and readiness endpoints
- Structured logging and error handling
- Automated unit, integration, and acceptance tests
- A responsive browser-based demo for portfolio screenshots

## Architecture

```mermaid
flowchart LR
    C[API client or demo page] --> A[Express API]
    A --> S[Search service]
    S --> E[Embedding provider]
    S --> R[(Redis cache)]
    S --> P[(PostgreSQL + pgvector)]
```

## Technology stack

- Node.js and TypeScript
- Express
- PostgreSQL and `pgvector`
- Redis
- Parameterized SQL through `pg`
- A local sentence-transformer model
- Jest and Supertest
- Docker Compose for local infrastructure

All dependencies are pinned in `package-lock.json`. The application uses `Xenova/all-MiniLM-L6-v2` through Transformers.js to generate normalized 384-dimensional embeddings locally.

## Current repository structure

```text
task-09-semantic-search/
|-- docs/                    Architecture, API, benchmark, evidence, and spec
|-- migrations/              Versioned pgvector schema
|-- scripts/                 Migrate, seed, reindex, acceptance, and benchmark
|-- src/
|   |-- modules/products/    Product persistence and update lifecycle
|   |-- modules/search/      Embeddings, cache, vectors, and orchestration
|   |-- public/demo/         Semantic Search Lab
|   |-- app.ts
|   `-- server.ts
|-- tests/                   Unit, HTTP, and infrastructure integration tests
|-- compose.yaml
|-- package.json
`-- task.bat
```

The source is separated behind embedding, repository, cache, and orchestration interfaces so the semantic-search module can be reused by the later e-commerce capstone.

## Implementation roadmap

- [x] Define the technical specification
- [x] Create the initial folder structure
- [x] Add safe environment-variable examples
- [x] Configure the TypeScript application and dependencies
- [x] Start PostgreSQL with `pgvector` and Redis locally
- [x] Design product and embedding persistence
- [x] Implement real local embedding generation
- [x] Implement semantic search and cosine ranking
- [x] Add Redis cache-aside and catalog-version invalidation
- [x] Build the browser demo
- [x] Add unit, HTTP, integration, relevance, and performance tests
- [x] Document setup and API usage

## Quick start on Windows

Requirements: Node.js 20 or newer and Docker Desktop.

```bat
task.bat run
```

The launcher installs dependencies when necessary, starts only Task 9 containers, applies migrations, seeds an empty catalog, downloads or loads the embedding model, and starts the API. Open `http://localhost:3009/demo` or run `task.bat demo`.

The first model use downloads public model files into the ignored `.cache/models` directory. After that, set `ALLOW_REMOTE_MODELS=false` for local-only loading.

Available commands:

```text
task.bat run
task.bat demo
task.bat test
task.bat verify
task.bat seed
task.bat benchmark
task.bat stop
task.bat help
```

## Portfolio evidence

`docs/evidence/` contains a safe checklist for screenshots and recordings. Recommended visual evidence includes:

- A semantic query and ranked results in the browser demo
- PostgreSQL records with stored embedding metadata
- A Redis cache hit demonstrated through logs or metrics
- Passing automated tests

## Documentation

- [Detailed technical specification](docs/SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [Measured benchmark](docs/BENCHMARK.md)
- [Evidence guide](docs/evidence/README.md)
- [Shared project standards](../TASK_PROJECT_STANDARDS.md)

This task is part of the [Elevvo Backend Development Internship portfolio](../README.md).
