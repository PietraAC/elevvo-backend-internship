import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().max(320).pipe(z.email()),
  name: z.string().trim().min(2).max(120),
  role: z.enum(["CUSTOMER", "ADMIN"]).default("CUSTOMER")
}).strict();

export const orderListQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
