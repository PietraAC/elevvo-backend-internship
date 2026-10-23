import { Prisma } from "../../generated/prisma/client.js";
import { AppError, conflict, notFound } from "../../errors/app-error.js";
import { hasPrismaCode } from "../../errors/prisma-error.js";
import { prisma } from "../../lib/prisma.js";
import { calculateOrder } from "./checkout.domain.js";
import { toOrderDto } from "./order.mapper.js";

const MAX_TRANSACTION_ATTEMPTS = 3;

async function performCheckout(userId: number) {
  return prisma.$transaction(
    async (transaction) => {
      const cart = await transaction.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
            orderBy: { id: "asc" }
          }
        }
      });

      if (!cart) throw notFound("Cart");
      if (cart.items.length === 0) {
        throw conflict("EMPTY_CART", "The cart has no items");
      }

      for (const item of cart.items) {
        if (!item.product.active) {
          throw conflict(
            "PRODUCT_UNAVAILABLE",
            `Product ${item.productId} is not available`
          );
        }
      }

      const { lines, total } = calculateOrder(
        cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity
        }))
      );

      for (const line of lines) {
        const stockUpdate = await transaction.product.updateMany({
          where: {
            id: line.productId,
            active: true,
            stock: { gte: line.quantity }
          },
          data: { stock: { decrement: line.quantity } }
        });

        if (stockUpdate.count !== 1) {
          throw conflict(
            "OUT_OF_STOCK",
            `Product ${line.productId} does not have enough stock`
          );
        }
      }

      const order = await transaction.order.create({
        data: {
          userId,
          total,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              subtotal: line.subtotal
            }))
          }
        },
        include: { items: true }
      });

      await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000
    }
  );
}

export const orderService = {
  async checkout(userId: number) {
    const startedAt = performance.now();

    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        const order = await performCheckout(userId);
        console.info("Checkout committed", {
          userId,
          orderId: order.id,
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
          attempt
        });
        return toOrderDto(order);
      } catch (error) {
        if (hasPrismaCode(error, "P2034") && attempt < MAX_TRANSACTION_ATTEMPTS) {
          continue;
        }

        console.warn("Checkout rolled back", {
          userId,
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
          attempt,
          reason: error instanceof Error ? error.message : "Unknown error"
        });

        if (hasPrismaCode(error, "P2034")) {
          throw new AppError(
            409,
            "TRANSACTION_CONFLICT",
            "The checkout conflicted with another transaction; retry the request"
          );
        }
        throw error;
      }
    }

    throw new AppError(409, "TRANSACTION_CONFLICT", "Checkout could not be completed");
  },

  async getById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } }
      }
    });
    if (!order) throw notFound("Order");
    return toOrderDto(order);
  }
};
