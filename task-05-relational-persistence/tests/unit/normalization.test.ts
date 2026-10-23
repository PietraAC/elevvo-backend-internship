import { normalizeCategory, normalizeEmail, normalizeSku } from "../../src/utils/normalization.js";

describe("normalization", () => {
  it("normalizes identifiers consistently", () => {
    expect(normalizeEmail("  Customer@Example.COM ")).toBe("customer@example.com");
    expect(normalizeSku("  item-001 ")).toBe("ITEM-001");
    expect(normalizeCategory("  OutDoor ")).toBe("outdoor");
  });
});
