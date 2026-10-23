import { z } from "zod";

const idSchema = z.coerce.number().int().positive();

export function parseId(value: unknown): number {
  return idSchema.parse(value);
}
