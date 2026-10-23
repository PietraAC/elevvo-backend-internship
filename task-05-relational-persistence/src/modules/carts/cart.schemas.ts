import { z } from "zod";

export const setCartItemSchema = z.object({
  quantity: z.number().int().positive()
}).strict();
