import { closeDatabase } from '../src/lib/database.js';
import { closeRedis, getRedisClient } from '../src/lib/redis.js';
import { ProductRepository } from '../src/modules/products/product.repository.js';
import { getEmbeddingProvider } from '../src/modules/search/embedding-provider.js';
import { normalizeQuery } from '../src/modules/search/query.js';
import { RedisSearchResultCache } from '../src/modules/search/search-cache.js';
import { DefaultSemanticSearchService } from '../src/modules/search/search.service.js';

const cases = [
  ['something warm and light for a snowy hike', 'OUT-ALPINE-SHELL'],
  ['quiet headphones for a long flight', 'ELE-TRAVEL-HEADPHONES'],
  ['a soft light for reading in bed at night', 'HOM-READING-LAMP'],
  ['help my sore muscles after a hard workout', 'FIT-RECOVERY-DEVICE'],
  ['carry cold drinks and lunch to the beach', 'OUT-COOLER-BACKPACK']
] as const;

async function acceptance(): Promise<void> {
  const redis = await getRedisClient();
  await redis?.flushDb();
  const service = new DefaultSemanticSearchService(new ProductRepository(), getEmbeddingProvider(), new RedisSearchResultCache());
  let failed = 0;

  for (const [query, expectedSku] of cases) {
    const response = await service.search(normalizeQuery(query), 3);
    const rank = response.data.findIndex((product) => product.sku === expectedSku) + 1;
    const passed = rank > 0 && rank <= 3;
    console.log(`${passed ? 'PASS' : 'FAIL'} | rank ${rank || '-'} | ${expectedSku} | ${query}`);
    if (!passed) failed += 1;
  }
  if (failed) throw new Error(`${failed} semantic relevance case(s) failed.`);
  console.log('All five real-model semantic relevance cases passed.');
}

acceptance().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Acceptance suite failed.');
  process.exitCode = 1;
}).finally(async () => {
  await Promise.allSettled([closeRedis(), closeDatabase()]);
});
