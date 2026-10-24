import { createHash } from 'node:crypto';

export interface SearchableProduct {
  name: string;
  description: string;
  category: string;
  tags: string[];
}

export function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => collapseWhitespace(tag).toLowerCase()).filter(Boolean))].sort();
}

export function canonicalProductText(product: SearchableProduct): string {
  const tags = normalizeTags(product.tags);
  return [
    `Product: ${collapseWhitespace(product.name)}`,
    `Category: ${collapseWhitespace(product.category)}`,
    `Description: ${collapseWhitespace(product.description)}`,
    `Tags: ${tags.join(', ')}`
  ].join('\n');
}

export function contentHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
