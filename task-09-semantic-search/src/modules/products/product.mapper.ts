import type { ProductRecord, SearchProduct } from './product.types.js';
import { similarityFromDistance } from '../search/vector.js';

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  active: boolean;
  embedding_model: string;
  embedding_content_hash: string;
  embedded_at: Date;
  created_at: Date;
  updated_at: Date;
};

export function mapProduct(row: ProductRow): ProductRecord {
  return {
    id: String(row.id),
    sku: row.sku,
    name: row.name,
    description: row.description,
    category: row.category,
    tags: row.tags,
    price: row.price,
    active: row.active,
    embeddingModel: row.embedding_model,
    embeddingContentHash: row.embedding_content_hash,
    embeddedAt: row.embedded_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export function mapSearchProduct(row: ProductRow & { distance: string }): SearchProduct {
  return {
    id: String(row.id),
    sku: row.sku,
    name: row.name,
    description: row.description,
    category: row.category,
    tags: row.tags,
    price: row.price,
    similarity: similarityFromDistance(Number(row.distance))
  };
}
