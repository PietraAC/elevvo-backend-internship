import { closeDatabase } from '../src/lib/database.js';
import { ProductRepository } from '../src/modules/products/product.repository.js';
import { canonicalProductText, contentHash } from '../src/modules/products/product-text.js';
import { getEmbeddingProvider } from '../src/modules/search/embedding-provider.js';
import { seedProducts } from './seed-data.js';

async function seed(): Promise<void> {
  const repository = new ProductRepository();
  const embeddings = getEmbeddingProvider();
  const counts = { created: 0, updated: 0, unchanged: 0 };
  await embeddings.warm();

  for (const product of seedProducts) {
    const text = canonicalProductText(product);
    const status = await repository.upsertSeed(
      product,
      await embeddings.embed(text),
      embeddings.dimensions,
      embeddings.model,
      contentHash(text)
    );
    counts[status] += 1;
    console.log(`${status.padEnd(9)} ${product.sku}`);
  }
  console.log(`Seed complete: ${counts.created} created, ${counts.updated} updated, ${counts.unchanged} unchanged.`);
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Seed failed.');
  process.exitCode = 1;
}).finally(() => closeDatabase());
