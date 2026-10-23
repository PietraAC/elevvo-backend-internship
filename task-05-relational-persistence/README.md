# Task 5 - Relational Persistence with PostgreSQL and Prisma

An Express and TypeScript API that implements relational persistence,
database-level integrity, paginated queries, nested writes, and an atomic
e-commerce checkout with PostgreSQL and Prisma ORM.

**Status:** Implemented and verified locally.

## Implemented features

- User, Product, Cart, CartItem, Order, and OrderItem models.
- One-to-many and explicit many-to-many relationships.
- Reproducible, versioned migrations with database constraints.
- Deterministic development seed data.
- Product CRUD with logical deletion.
- Database-level pagination and composable filters.
- Nested User + Cart and Order + OrderItem writes.
- Serializable checkout with conditional stock deduction.
- Full rollback and bounded retry behavior for concurrent conflicts.
- Unit, HTTP, and integration tests against a real PostgreSQL database.

## Prerequisites

- Node.js 24 or another version supported by Prisma 7.
- Docker Desktop with Docker Compose.

## Windows launcher

Use [`task.bat`](./task.bat) to operate only this project. Double-click the file
to open its interactive menu, or run a command from a terminal:

```bat
task.bat run
task.bat test
task.bat verify
task.bat seed
task.bat stop
```

- `run` starts the Task 5 PostgreSQL service, applies migrations, and runs the
  API at `http://localhost:3000`.
- `test` starts the isolated test database, runs the complete test suite, and
  stops the test database.
- `verify` runs strict type checking, tests, and the production build.
- `seed` prepares the development database and recreates demonstration data.
- `stop` stops only the containers defined by Task 5.

## Manual setup

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start the databases with `docker compose up -d postgres postgres-test`.
4. Apply migrations with `npm run db:deploy`.
5. Load demonstration data with `npm run db:seed`.
6. Start the API with `npm run dev`.

## Validation

- `npm run typecheck` validates strict TypeScript.
- `npm run build` generates Prisma Client and compiles the application.
- `npm run test:unit` runs tests that do not require a database.
- `npm run test:integration` runs integration tests against PostgreSQL on port
  5433.
- `npm test` runs the complete test suite.

Before running integration tests manually, apply migrations to the test database
by using `TEST_DATABASE_URL` as `DATABASE_URL` for `npm run db:deploy`.

## Documentation

- [Complete implementation specification](<../specs/TASK_05_RELATIONAL_PERSISTENCE_SPEC.md>)
- [Relational model](docs/ERD.md)
- [HTTP API](docs/API.md)
- [Functional demonstration and screenshot guide](docs/DEMO.md)
- [Internship task project standards](../TASK_PROJECT_STANDARDS.md)

## Portfolio evidence

Task 5 is a backend project, so its functional evidence does not require a
frontend. The recommended screenshots are:

- the rendered Mermaid entity-relationship diagram;
- a successful checkout response in an API client;
- the rollback response for insufficient stock;
- the final `task.bat verify` summary showing all tests and the build passing.

Follow the reproducible sequence in [`docs/DEMO.md`](docs/DEMO.md) before
capturing final evidence.

## Important decisions

- Monetary values use `Decimal(12,2)` and are serialized as strings.
- SKU is immutable after product creation.
- Products are deactivated instead of physically deleted.
- Clients never provide order totals or item subtotals.
- `OrderItem` stores product name and price snapshots.
- Adding an item to a cart does not reserve stock.
- Concurrent checkouts must never produce negative stock.

