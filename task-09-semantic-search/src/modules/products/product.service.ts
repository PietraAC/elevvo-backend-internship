import { AppError } from '../../errors/app-error.js';
import type { EmbeddingProvider } from '../search/embedding-provider.js';
import { canonicalProductText, contentHash, normalizeTags } from './product-text.js';
import { ProductRepository } from './product.repository.js';
import type { ProductRecord, ProductUpdate } from './product.types.js';

export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly embeddings: EmbeddingProvider
  ) {}

  async get(id: string): Promise<ProductRecord> {
    const product = await this.repository.findById(id);
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'The requested product was not found.');
    return product;
  }

  async update(id: string, update: ProductUpdate): Promise<ProductRecord> {
    const current = await this.get(id);
    const normalized: ProductUpdate = { ...update };
    if (update.tags) normalized.tags = normalizeTags(update.tags);

    const next = { ...current, ...normalized };
    const nextText = canonicalProductText(next);
    const nextHash = contentHash(nextText);
    const searchableChanged = nextHash !== current.embeddingContentHash || current.embeddingModel !== this.embeddings.model;

    const embeddingChange = searchableChanged
      ? {
          vector: await this.embeddings.embed(nextText),
          dimensions: this.embeddings.dimensions,
          model: this.embeddings.model,
          hash: nextHash
        }
      : undefined;

    return this.repository.update(id, normalized, embeddingChange);
  }
}
