import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import { config } from '../src/config/env.js';
import { closeDatabase } from '../src/lib/database.js';
import { closeRedis, getRedisClient } from '../src/lib/redis.js';
import { ProductRepository } from '../src/modules/products/product.repository.js';
import { getEmbeddingProvider } from '../src/modules/search/embedding-provider.js';
import { normalizeQuery } from '../src/modules/search/query.js';
import { RedisSearchResultCache } from '../src/modules/search/search-cache.js';
import { DefaultSemanticSearchService } from '../src/modules/search/search.service.js';

function percentile(values: number[], quantile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)] ?? 0;
}

async function benchmark(): Promise<void> {
  const redis = await getRedisClient();
  await redis?.flushDb();
  const service = new DefaultSemanticSearchService(new ProductRepository(), getEmbeddingProvider(), new RedisSearchResultCache());
  const query = normalizeQuery('something warm and light for a snowy hike');
  await service.search(query, 5);

  const sequential: number[] = [];
  let hits = 0;
  for (let index = 0; index < 100; index += 1) {
    const response = await service.search(query, 5);
    sequential.push(response.meta.timing.totalMs);
    if (response.meta.cache.status === 'HIT') hits += 1;
  }
  const concurrent = await Promise.all(Array.from({ length: 20 }, () => service.search(query, 5)));
  const concurrentHits = concurrent.filter((response) => response.meta.cache.status === 'HIT').length;
  const summary = {
    minimum: Math.min(...sequential),
    median: percentile(sequential, 0.5),
    p95: percentile(sequential, 0.95),
    p99: percentile(sequential, 0.99),
    maximum: Math.max(...sequential)
  };
  const passed = hits === 100 && summary.p95 < 100;
  const report = `# Task 9 Local Benchmark\n\n` +
    `- Date: ${new Date().toISOString()}\n- Runtime: Node.js ${process.version}\n` +
    `- Platform: ${os.platform()} ${os.release()}, ${os.cpus()[0]?.model.trim() ?? 'unknown CPU'}\n` +
    `- Model: ${config.EMBEDDING_MODEL}\n` +
    `- Method: one explicit MISS, 100 sequential HIT requests, then 20 concurrent requests\n\n` +
    `| Metric | Result |\n|---|---:|\n| Minimum | ${summary.minimum.toFixed(1)} ms |\n` +
    `| Median | ${summary.median.toFixed(1)} ms |\n| p95 | ${summary.p95.toFixed(1)} ms |\n` +
    `| p99 | ${summary.p99.toFixed(1)} ms |\n| Maximum | ${summary.maximum.toFixed(1)} ms |\n` +
    `| Sequential cache hits | ${hits}/100 |\n| Concurrent cache hits | ${concurrentHits}/20 |\n\n` +
    `**Result:** ${passed ? 'PASS' : 'FAIL'} — warm-cache p95 must be below 100 ms with 100/100 cache hits.\n`;
  await writeFile(new URL('../docs/BENCHMARK.md', import.meta.url), report, 'utf8');
  console.log(report);
  if (!passed) process.exitCode = 1;
}

benchmark().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Benchmark failed.');
  process.exitCode = 1;
}).finally(async () => {
  await Promise.allSettled([closeRedis(), closeDatabase()]);
});
