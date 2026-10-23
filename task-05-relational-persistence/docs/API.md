# HTTP API

Local base URL: `http://localhost:3000`

| Method | Route | Primary result |
|---|---|---|
| GET | `/health` | Returns API health |
| POST | `/api/users` | Creates a user and nested cart |
| GET | `/api/users/:id` | Returns a user |
| GET | `/api/users/:id/orders` | Lists the user's paginated orders |
| POST | `/api/products` | Creates a product |
| GET | `/api/products` | Lists and filters products |
| GET | `/api/products/:id` | Returns a product |
| PATCH | `/api/products/:id` | Updates a product except for its SKU |
| DELETE | `/api/products/:id` | Logically deletes a product |
| GET | `/api/users/:userId/cart` | Returns a user's cart |
| PUT | `/api/users/:userId/cart/items/:productId` | Creates or replaces an item quantity |
| DELETE | `/api/users/:userId/cart/items/:productId` | Removes an item from the cart |
| POST | `/api/users/:userId/checkout` | Creates an order atomically |
| GET | `/api/orders/:id` | Returns an order and its item snapshots |

## Product pagination and filters

`GET /api/products` accepts `skip`, `take`, `category`, `minPrice`, `maxPrice`,
`inStock`, and `active`.

- `skip` defaults to 0 and cannot be negative.
- `take` defaults to 20 and has a maximum of 100.
- Active products are returned by default.
- Filters are combined in PostgreSQL rather than applied in memory.
- The response includes `items`, `skip`, `take`, and the total number of matching
  records.

## Checkout

`POST /api/users/:userId/checkout` converts the user's current cart into an
order inside a serializable database transaction. The client does not provide
prices, subtotals, or the order total.

A successful checkout:

1. reloads the cart and current product data;
2. verifies product availability and stock;
3. deducts stock conditionally;
4. creates the order and nested item snapshots;
5. clears the cart;
6. commits every change together.

Any failure rolls back the complete operation.

## Error contract

Errors return `code`, `message`, `requestId`, and optional validation `details`.

| Situation | HTTP | Code |
|---|---:|---|
| Invalid input | 400 | `VALIDATION_ERROR` |
| Missing resource | 404 | `RESOURCE_NOT_FOUND` |
| Duplicate email or SKU | 409 | `UNIQUE_CONSTRAINT_VIOLATION` |
| Empty cart | 409 | `EMPTY_CART` |
| Unavailable product | 409 | `PRODUCT_UNAVAILABLE` |
| Insufficient stock | 409 | `OUT_OF_STOCK` |
| Transaction conflict after retries | 409 | `TRANSACTION_CONFLICT` |
| Database unavailable | 503 | `DATABASE_UNAVAILABLE` |
| Unexpected failure | 500 | `INTERNAL_ERROR` |

Database messages, SQL queries, and credentials are never exposed to clients.

## Temporary identity model

Task 5 includes `userId` explicitly in cart and checkout routes because
authentication is outside its scope. Task 10 will derive the user identity from
the authenticated JWT instead.

