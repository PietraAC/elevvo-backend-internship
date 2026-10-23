import { prisma } from "../src/lib/prisma.js";

async function main(): Promise<void> {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const products = await prisma.product.createManyAndReturn({
    data: [
      {
        sku: "BACKPACK-001",
        name: "Trail Backpack 30L",
        description: "Lightweight backpack for day hikes and urban travel.",
        category: "outdoor",
        price: "89.90",
        stock: 12
      },
      {
        sku: "JACKET-001",
        name: "Insulated Hiking Jacket",
        description: "Warm and packable jacket for cold-weather hiking.",
        category: "clothing",
        price: "149.90",
        stock: 8
      },
      {
        sku: "BOTTLE-001",
        name: "Thermal Bottle 750ml",
        description: "Stainless-steel insulated bottle for hot and cold drinks.",
        category: "outdoor",
        price: "34.50",
        stock: 20
      },
      {
        sku: "HEADPHONES-001",
        name: "Wireless Headphones",
        description: "Over-ear headphones with active noise cancellation.",
        category: "electronics",
        price: "199.00",
        stock: 5
      },
      {
        sku: "KEYBOARD-001",
        name: "Mechanical Keyboard",
        description: "Compact mechanical keyboard for software development.",
        category: "electronics",
        price: "119.00",
        stock: 0
      },
      {
        sku: "ARCHIVED-001",
        name: "Archived Product",
        description: "Inactive product used to demonstrate logical deletion.",
        category: "archive",
        price: "10.00",
        stock: 2,
        active: false
      }
    ]
  });

  const backpack = products.find((product) => product.sku === "BACKPACK-001");
  const bottle = products.find((product) => product.sku === "BOTTLE-001");
  if (!backpack || !bottle) throw new Error("Seed products were not created");

  const customer = await prisma.user.create({
    data: {
      email: "customer@example.com",
      name: "Demo Customer",
      role: "CUSTOMER",
      cart: {
        create: {
          items: {
            create: [
              { productId: backpack.id, quantity: 1 },
              { productId: bottle.id, quantity: 2 }
            ]
          }
        }
      }
    },
    include: { cart: true }
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Demo Admin",
      role: "ADMIN",
      cart: { create: {} }
    }
  });

  console.info("Development seed completed", {
    users: 2,
    products: products.length,
    customerId: customer.id,
    customerCartId: customer.cart?.id,
    adminId: admin.id
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
