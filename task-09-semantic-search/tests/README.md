# Test structure

The test suites have not been implemented yet.

- `unit/` will cover isolated domain and utility behavior.
- `integration/` will cover PostgreSQL, `pgvector`, Redis, and API boundaries.
- `acceptance/` will verify complete user-facing search scenarios.
- `setup/` will hold shared test lifecycle helpers.

Test commands will be documented after the test runner and infrastructure are configured.
