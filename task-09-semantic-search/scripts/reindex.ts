import { closeDatabase } from '../src/lib/database.js';
import { ProductRepository } from '../src/modules/products/product.repository.js';
import { ProductService } from '../src/modules/products/product.service.js';
import { canonicalProductText, contentHash } from '../src/modules/products/product-text.js';
import { getEmbeddingProvider } from '../src/modules/search/embedding-provider.js';

async function reindex(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const repository = new ProductRepository();
  const embeddings = getEmbeddingProvider();
  const service = new ProductService(repository, embeddings);
  const products = await repository.allForReindex();
  const report = { processed: 0, skipped: 0, failed: 0, remaining: 0 };

  for (const product of products) {
    const expectedHash = contentHash(canonicalProductText(product.canonicalFields));
    if (product.embeddingContentHash === expectedHash && product.embeddingModel === embeddings.model) {
      report.skipped += 1;
      continue;
    }
    report.remaining += 1;
    if (dryRun) continue;
    try {
      await service.update(product.id, { name: product.name });
      report.processed += 1;
      report.remaining -= 1;
    } catch {
      report.failed += 1;
    }
  }
  console.log(JSON.stringify({ dryRun, ...report }, null, 2));
  if (report.failed > 0) process.exitCode = 1;
}

reindex().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Reindex failed.');
  process.exitCode = 1;
}).finally(() => closeDatabase());
