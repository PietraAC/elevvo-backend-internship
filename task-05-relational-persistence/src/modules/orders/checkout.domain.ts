import { Prisma } from "../../generated/prisma/client.js";

export type PricedItem = {
  productId: number;
  productName: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
};

export type CalculatedLine = PricedItem & {
  subtotal: Prisma.Decimal;
};

export function calculateOrder(items: PricedItem[]): {
  lines: CalculatedLine[];
  total: Prisma.Decimal;
} {
  const lines = items.map((item) => ({
    ...item,
    subtotal: item.unitPrice.mul(item.quantity)
  }));

  const total = lines.reduce(
    (sum, line) => sum.add(line.subtotal),
    new Prisma.Decimal(0)
  );

  return { lines, total };
}
