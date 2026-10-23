import { dateToString, moneyToString } from "../../utils/serialization.js";

type ProductRecord = {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: { toFixed(fractionDigits?: number): string };
  stock: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const toProductDto = (product: ProductRecord) => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  description: product.description,
  category: product.category,
  price: moneyToString(product.price),
  stock: product.stock,
  active: product.active,
  createdAt: dateToString(product.createdAt),
  updatedAt: dateToString(product.updatedAt)
});
