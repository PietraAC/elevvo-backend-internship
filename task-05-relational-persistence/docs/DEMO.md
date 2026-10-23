# Functional Demonstration and Screenshot Guide

## Purpose

Task 5 is a backend persistence project. Its portfolio evidence should show the
real relational model, a successful transactional checkout, a failed checkout
with complete rollback, and the automated quality checks. A separate frontend
is not required.

## Preparation

From the project directory, run:

```bat
task.bat seed
task.bat run
```

Keep the API terminal open. Use an API client such as Postman, Insomnia, Bruno,
or the VS Code REST Client for the requests below.

## Evidence 1 - Relational design

Open `docs/ERD.md` in a Markdown preview that renders Mermaid. Capture the full
diagram and the integrity decisions in one image when possible.

The screenshot should make these relationships visible:

- one User owns one Cart;
- one User places many Orders;
- CartItem connects Cart and Product;
- OrderItem connects Order and Product and stores historical snapshots.

## Evidence 2 - Successful atomic checkout

The deterministic seed creates `customer@example.com` with a cart containing a
backpack and two thermal bottles. The seed output prints `customerId` and
`customerCartId`. Use the printed customer ID in the requests below.

First retrieve the cart:

```http
GET http://localhost:3000/api/users/{customerId}/cart
```

Then perform checkout:

```http
POST http://localhost:3000/api/users/{customerId}/checkout
Content-Type: application/json

{}
```

Capture the `201 Created` response showing the order, item snapshots, quantities,
subtotals, and server-calculated total. Do not crop out the request method, URL,
status code, or response body.

Seeded numeric IDs may change if the local database was used previously. Always
use the ID printed by the latest seed run.

## Evidence 3 - Rollback on insufficient stock

Use the flow covered by the integration test:

1. create a user;
2. create one product with sufficient stock;
3. create another product with insufficient stock;
4. add both products to the user's cart;
5. attempt checkout;
6. show the `OUT_OF_STOCK` response;
7. retrieve the cart and products to prove that no partial stock deduction,
   order, or cart cleanup was committed.

For a concise LinkedIn post, the automated integration-test output can be used
as the rollback evidence instead of displaying every setup request.

## Evidence 4 - Automated verification

Run:

```bat
task.bat verify
```

Capture the final terminal section showing:

- strict TypeScript checking completed;
- 3 test suites passed;
- 7 tests passed;
- the production build completed;
- `Task 05 validation completed successfully.`

## Screenshot rules

- Use English-only labels and captions.
- Hide environment files, database URLs, usernames, and unrelated desktop
  content.
- Use deterministic seed data.
- Keep the HTTP status, endpoint, and relevant response visible.
- Do not present mocked responses as runtime evidence.
- Prefer a 16:9 or 4:3 crop that remains readable on LinkedIn.

