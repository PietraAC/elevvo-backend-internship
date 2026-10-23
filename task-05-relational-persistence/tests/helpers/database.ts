import { prisma } from "../../src/lib/prisma.js";

export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany()
  ]);
}
