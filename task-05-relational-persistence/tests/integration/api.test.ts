import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { resetDatabase } from "../helpers/database.js";

const app = createApp();

async function createUser(email: string) {
  const response = await request(app).post("/api/users").send({
    email,
    name: "Test Customer",
    role: "CUSTOMER"
  });
  expect(response.status).toBe(201);
  return response.body as { id: number };
}

async function createProduct(overrides: Record<string, unknown> = {}) {
  const response = await request(app).post("/api/products").send({
    sku: `SKU-${crypto.randomUUID()}`,
    name: "Test Product",
    description: "Product created by the integration test suite.",
    category: "testing",
    price: "25.50",
    stock: 10,
    ...overrides
  });
  expect(response.status).toBe(201);
  return response.body as { id: number; price: string };
}

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Task 5 API", () => {
  it("creates a user with a cart and rejects the normalized duplicate email", async () => {
    const user = await createUser("Customer@Example.com");

    const cartResponse = await request(app).get(`/api/users/${user.id}/cart`);
    expect(cartResponse.status).toBe(200);
    expect(cartResponse.body).toMatchObject({ userId: user.id, items: [] });

    const duplicate = await request(app).post("/api/users").send({
      email: "  customer@example.COM ",
      name: "Duplicate Customer"
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe("UNIQUE_CONSTRAINT_VIOLATION");
  });

  it("paginates and combines product filters in PostgreSQL", async () => {
    await createProduct({ sku: "OUT-001", category: "Outdoor", price: "10.00", stock: 4 });
    await createProduct({ sku: "OUT-002", category: "Outdoor", price: "30.00", stock: 0 });
    await createProduct({ sku: "ELEC-001", category: "Electronics", price: "50.00", stock: 3 });

    const response = await request(app)
      .get("/api/products")
      .query({ category: "OUTDOOR", minPrice: 5, maxPrice: 20, inStock: true, skip: 0, take: 1 });

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({ skip: 0, take: 1, total: 1 });
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({ sku: "OUT-001", price: "10.00" });
  });

  it("checks out atomically, stores snapshots, reduces stock and clears the cart", async () => {
    const user = await createUser("checkout@example.com");
    const product = await createProduct({ sku: "CHECKOUT-001", name: "Original Name", price: "12.50", stock: 5 });

    const cartResponse = await request(app)
      .put(`/api/users/${user.id}/cart/items/${product.id}`)
      .send({ quantity: 2 });
    expect(cartResponse.status).toBe(200);

    const checkout = await request(app).post(`/api/users/${user.id}/checkout`);
    expect(checkout.status).toBe(201);
    expect(checkout.body).toMatchObject({ total: "25.00" });
    expect(checkout.body.items[0]).toMatchObject({
      productName: "Original Name",
      unitPrice: "12.50",
      quantity: 2,
      subtotal: "25.00"
    });

    await request(app)
      .patch(`/api/products/${product.id}`)
      .send({ name: "Changed Name", price: "99.00" })
      .expect(200);

    const storedOrder = await request(app).get(`/api/orders/${checkout.body.id}`);
    expect(storedOrder.body.items[0]).toMatchObject({
      productName: "Original Name",
      unitPrice: "12.50"
    });

    const userOrders = await request(app).get(`/api/users/${user.id}/orders`);
    expect(userOrders.status).toBe(200);
    expect(userOrders.body.pagination).toEqual({ skip: 0, take: 20, total: 1 });

    await request(app).delete(`/api/products/${product.id}`).expect(204);
    const archivedProduct = await request(app).get(`/api/products/${product.id}`);
    expect(archivedProduct.body.active).toBe(false);

    const orderAfterProductDeletion = await request(app).get(`/api/orders/${checkout.body.id}`);
    expect(orderAfterProductDeletion.body.items[0]).toMatchObject({
      productName: "Original Name",
      unitPrice: "12.50"
    });

    const storedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(storedProduct.stock).toBe(3);
    expect(storedProduct.active).toBe(false);
    expect(await prisma.cartItem.count()).toBe(0);
  });

  it("rolls back every write when any item has insufficient stock", async () => {
    const user = await createUser("rollback@example.com");
    const available = await createProduct({ sku: "ROLLBACK-OK", stock: 5 });
    const unavailable = await createProduct({ sku: "ROLLBACK-NO", stock: 1 });

    await request(app)
      .put(`/api/users/${user.id}/cart/items/${available.id}`)
      .send({ quantity: 2 })
      .expect(200);
    await request(app)
      .put(`/api/users/${user.id}/cart/items/${unavailable.id}`)
      .send({ quantity: 2 })
      .expect(200);

    const checkout = await request(app).post(`/api/users/${user.id}/checkout`);
    expect(checkout.status).toBe(409);
    expect(checkout.body.code).toBe("OUT_OF_STOCK");

    const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
    expect(products.find((item) => item.id === available.id)?.stock).toBe(5);
    expect(products.find((item) => item.id === unavailable.id)?.stock).toBe(1);
    expect(await prisma.order.count()).toBe(0);
    expect(await prisma.cartItem.count()).toBe(2);
  });

  it("prevents overselling during concurrent checkouts", async () => {
    const firstUser = await createUser("concurrent-1@example.com");
    const secondUser = await createUser("concurrent-2@example.com");
    const product = await createProduct({ sku: "CONCURRENT-001", stock: 1 });

    await request(app)
      .put(`/api/users/${firstUser.id}/cart/items/${product.id}`)
      .send({ quantity: 1 })
      .expect(200);
    await request(app)
      .put(`/api/users/${secondUser.id}/cart/items/${product.id}`)
      .send({ quantity: 1 })
      .expect(200);

    const [first, second] = await Promise.all([
      request(app).post(`/api/users/${firstUser.id}/checkout`),
      request(app).post(`/api/users/${secondUser.id}/checkout`)
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect(await prisma.order.count()).toBe(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(0);
  });
});
