export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizeCategory = (category: string): string =>
  category.trim().toLowerCase();

export const normalizeSku = (sku: string): string => sku.trim().toUpperCase();
