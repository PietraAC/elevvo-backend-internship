# API Reference

Base URL: `http://localhost:3009`

Every response contains `X-Request-Id`. Search responses also contain a `Server-Timing` header.

## Health

### `GET /health/live`

Confirms that the Node.js process is running.

### `GET /health/ready`

Checks PostgreSQL and the embedding model. Redis is shown as optional because search supports `BYPASS` mode.

## Catalog

### `GET /api/products?page=1&pageSize=12`

Returns paginated active products. `pageSize` must be between 1 and 50.

### `GET /api/products/:id`

Returns one product. Raw vector values are never returned.

### `PATCH /api/products/:id`

Accepts any non-empty subset of:

```json
{
  "name": "Updated product name",
  "description": "A detailed product description with at least twenty characters.",
  "category": "Outdoor",
  "tags": ["lightweight", "travel"],
  "price": "149.90",
  "active": true
}
```

SKU and embedding fields are rejected. Searchable changes regenerate the vector; price-only changes do not.

## Semantic search

### `GET /api/products/search?q={query}&limit={limit}`

- `q`: 3 to 300 visible characters
- `limit`: optional integer from 1 to 20; default `5`

Example:

```http
GET /api/products/search?q=quiet%20headphones%20for%20a%20long%20flight&limit=5
```

Response shape:

```json
{
  "data": [
    {
      "id": "2",
      "sku": "ELE-TRAVEL-HEADPHONES",
      "name": "Travel Silence Headphones",
      "description": "Wireless over-ear headphones with active noise reduction...",
      "category": "Electronics",
      "tags": ["noise-cancelling", "travel", "wireless"],
      "price": "249.00",
      "similarity": 0.7021
    }
  ],
  "meta": {
    "query": "quiet headphones for a long flight",
    "limit": 5,
    "resultCount": 5,
    "cache": { "status": "MISS", "ttlSeconds": 300 },
    "timing": { "totalMs": 12.4, "embeddingMs": 5.1, "databaseMs": 2.2, "cacheMs": 1.1 },
    "model": "Xenova/all-MiniLM-L6-v2",
    "catalogVersion": 18,
    "requestId": "generated-request-id"
  }
}
```

Cache states:

- `MISS`: Redis was available, but no cached result existed.
- `HIT`: Redis returned the result; embedding and database timings are zero.
- `BYPASS`: Redis was unavailable or contained invalid data; PostgreSQL search still succeeded.

Timing and similarity values above illustrate the response shape and are not fixed claims.

## Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The search query must contain between 3 and 300 characters.",
    "details": [],
    "requestId": "generated-request-id"
  }
}
```

Stable codes: `VALIDATION_ERROR`, `PRODUCT_NOT_FOUND`, `SKU_CONFLICT`, `EMBEDDING_UNAVAILABLE`, `DATABASE_UNAVAILABLE`, and `INTERNAL_ERROR`.

## Demo

### `GET /demo`

Serves the read-only Semantic Search Lab. Its results, cache badges, similarity bars, and timings come directly from the search API.
