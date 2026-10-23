import type { OrderStatus } from "../../generated/prisma/enums.js";
import { dateToString, moneyToString } from "../../utils/serialization.js";

type OrderRecord = {
  id: number;
  userId: number;
  status: OrderStatus;
  total: { toFixed(fractionDigits?: number): string };
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    unitPrice: { toFixed(fractionDigits?: number): string };
    quantity: number;
    subtotal: { toFixed(fractionDigits?: number): string };
  }>;
  user?: {
    id: number;
    email: string;
    name: string;
  };
};

export const toOrderDto = (order: OrderRecord) => ({
  id: order.id,
  userId: order.userId,
  status: order.status,
  total: moneyToString(order.total),
  items: order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    unitPrice: moneyToString(item.unitPrice),
    quantity: item.quantity,
    subtotal: moneyToString(item.subtotal)
  })),
  ...(order.user ? { user: order.user } : {}),
  createdAt: dateToString(order.createdAt),
  updatedAt: dateToString(order.updatedAt)
});
