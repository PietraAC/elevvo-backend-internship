import { Prisma } from "../../src/generated/prisma/client.js";
import { calculateOrder } from "../../src/modules/orders/checkout.domain.js";

describe("calculateOrder", () => {
  it("calculates decimal subtotals and total without floating-point drift", () => {
    const result = calculateOrder([
      {
        productId: 1,
        productName: "Product A",
        unitPrice: new Prisma.Decimal("19.90"),
        quantity: 3
      },
      {
        productId: 2,
        productName: "Product B",
        unitPrice: new Prisma.Decimal("10.05"),
        quantity: 2
      }
    ]);

    expect(result.lines[0]?.subtotal.toFixed(2)).toBe("59.70");
    expect(result.lines[1]?.subtotal.toFixed(2)).toBe("20.10");
    expect(result.total.toFixed(2)).toBe("79.80");
  });
});
