import { z } from 'zod';

const productName = z.string().trim().min(2).max(160);
const description = z.string().trim().min(20).max(5000);
const category = z.string().trim().min(2).max(80);
const tags = z.array(z.string().trim().min(1).max(50)).max(20);
const price = z.union([
  z.string().regex(/^\d{1,10}(?:\.\d{1,2})?$/).refine((value) => Number(value) > 0, 'Price must be greater than zero.'),
  z.number().positive().max(9_999_999_999.99).transform((value) => value.toFixed(2))
]);

export const productUpdateSchema = z
  .object({
    name: productName.optional(),
    description: description.optional(),
    category: category.optional(),
    tags: tags.optional(),
    price: price.optional(),
    active: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided.');

export const productIdSchema = z.string().regex(/^\d+$/);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12)
});
