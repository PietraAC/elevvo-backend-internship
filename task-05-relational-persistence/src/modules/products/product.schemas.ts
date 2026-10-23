import { z } from "zod";

const priceSchema = z.union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => /^\d{1,10}(\.\d{1,2})?$/.test(value), {
    message: "price must be a positive decimal with at most two decimal places"
  })
  .refine((value) => Number(value) > 0, { message: "price must be greater than zero" });

const booleanQuery = z.enum(["true", "false"]).transform((value) => value === "true");

export const createProductSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(1).max(5000),
  category: z.string().trim().min(1).max(120),
  price: priceSchema,
  stock: z.number().int().min(0),
  active: z.boolean().default(true)
}).strict();

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  price: priceSchema.optional(),
  stock: z.number().int().min(0).optional(),
  active: z.boolean().optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "at least one updatable field is required"
});

export const productListQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().min(1).max(120).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: booleanQuery.optional(),
  active: booleanQuery.optional()
}).refine(
  ({ minPrice, maxPrice }) => minPrice === undefined || maxPrice === undefined || maxPrice >= minPrice,
  { message: "maxPrice must be greater than or equal to minPrice", path: ["maxPrice"] }
);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
