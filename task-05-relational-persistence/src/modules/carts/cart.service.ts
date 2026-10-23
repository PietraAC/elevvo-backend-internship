import { conflict, notFound } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { toCartDto } from "./cart.mapper.js";

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          sku: true,
          name: true,
          price: true,
          stock: true,
          active: true
        }
      }
    },
    orderBy: { id: "asc" as const }
  }
};

async function findCartByUser(userId: number) {
  const cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  if (!cart) throw notFound("Cart");
  return cart;
}

export const cartService = {
  async getByUser(userId: number) {
    return toCartDto(await findCartByUser(userId));
  },

  async setItem(userId: number, productId: number, quantity: number) {
    const [cart, product] = await Promise.all([
      prisma.cart.findUnique({ where: { userId }, select: { id: true } }),
      prisma.product.findUnique({ where: { id: productId } })
    ]);

    if (!cart) throw notFound("Cart");
    if (!product) throw notFound("Product");
    if (!product.active) {
      throw conflict("PRODUCT_UNAVAILABLE", "The product is not available");
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity },
      create: { cartId: cart.id, productId, quantity }
    });

    return toCartDto(await findCartByUser(userId));
  },

  async removeItem(userId: number, productId: number) {
    const cart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
    if (!cart) throw notFound("Cart");

    const result = await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId }
    });
    if (result.count === 0) throw notFound("Cart item");
  }
};
