import { dateToString, moneyToString } from "../../utils/serialization.js";

type CartRecord = {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: number;
    productId: number;
    quantity: number;
    product: {
      sku: string;
      name: string;
      price: { toFixed(fractionDigits?: number): string };
      stock: number;
      active: boolean;
    };
  }>;
};

export const toCartDto = (cart: CartRecord) => ({
  id: cart.id,
  userId: cart.userId,
  items: cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: {
      sku: item.product.sku,
      name: item.product.name,
      price: moneyToString(item.product.price),
      stock: item.product.stock,
      active: item.product.active
    }
  })),
  createdAt: dateToString(cart.createdAt),
  updatedAt: dateToString(cart.updatedAt)
});
