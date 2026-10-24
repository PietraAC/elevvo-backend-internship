import { database, closeDatabase } from '../../src/lib/database.js';
import { closeRedis, getRedisClient } from '../../src/lib/redis.js';
import { RedisSearchResultCache } from '../../src/modules/search/search-cache.js';
import { ProductRepository } from '../../src/modules/products/product.repository.js';
import { ProductService } from '../../src/modules/products/product.service.js';
import { canonicalProductText, contentHash } from '../../src/modules/products/product-text.js';
import type { ProductInput } from '../../src/modules/products/product.types.js';
import type { EmbeddingProvider } from '../../src/modules/search/embedding-provider.js';

const describeIntegration = process.env.RUN_TASK09_INTEGRATION === 'true' ? describe : describe.skip;

describeIntegration('PostgreSQL and Redis infrastructure', () => {
  afterAll(async () => {
    await Promise.allSettled([closeRedis(), closeDatabase()]);
  });

  it('has pgvector, the 384-dimensional product vector, and the HNSW index', async () => {
    const extension = await database.query<{ installed: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname='vector') AS installed"
    );
    const dimension = await database.query<{ dimensions: number }>(
      "SELECT atttypmod AS dimensions FROM pg_attribute WHERE attrelid='products'::regclass AND attname='embedding'"
    );
    const index = await database.query<{ installed: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='products' AND indexname='products_embedding_hnsw_idx') AS installed"
    );
    expect(extension.rows[0]?.installed).toBe(true);
    expect(dimension.rows[0]?.dimensions).toBe(384);
    expect(index.rows[0]?.installed).toBe(true);
  });

  it('orders vectors by cosine distance and excludes inactive products', async () => {
    const unit = Array.from({ length: 384 }, (_, index) => index === 0 ? 1 : 0);
    const close = Array.from({ length: 384 }, (_, index) => index === 0 ? 0.9 : index === 1 ? 0.1 : 0);
    const far = Array.from({ length: 384 }, (_, index) => index === 1 ? 1 : 0);
    const vector = (values: number[]) => `[${values.join(',')}]`;
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM products');
      for (const [sku, active, embedding] of [['CLOSE', true, close], ['FAR', true, far], ['INACTIVE', false, unit]] as const) {
        await client.query(
          `INSERT INTO products (sku,name,description,category,tags,price,active,embedding,embedding_model,embedding_content_hash,embedded_at)
           VALUES ($1,$1,'A sufficiently detailed integration test product.','Test','{}',10,$2,$3::vector,'test',$4,NOW())`,
          [sku, active, vector(embedding), 'a'.repeat(64)]
        );
      }
      const result = await client.query<{ sku: string }>(
        'SELECT sku FROM products WHERE active=TRUE ORDER BY embedding <=> $1::vector, id',
        [vector(unit)]
      );
      expect(result.rows.map((row) => row.sku)).toEqual(['CLOSE', 'FAR']);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('stores cached results with a bounded positive TTL', async () => {
    const client = await getRedisClient();
    await client?.flushDb();
    const cache = new RedisSearchResultCache();
    const key = 'task09:test:ttl';
    await expect(cache.set(key, { results: [], model: 'test', catalogVersion: 1 })).resolves.toBe(true);
    const ttl = await client?.ttl(key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(cache.ttlSeconds);
    await expect(cache.get(key)).resolves.toMatchObject({ status: 'HIT' });
  });

  it('deletes malformed cached JSON and uses BYPASS', async () => {
    const client = await getRedisClient();
    const key = 'task09:test:malformed';
    await client?.set(key, '{not-valid-json', { EX: 60 });
    const cache = new RedisSearchResultCache();
    await expect(cache.get(key)).resolves.toEqual({ status: 'BYPASS' });
    await expect(client?.exists(key)).resolves.toBe(0);
  });

  it('increments catalog versions and regenerates vectors only for searchable changes', async () => {
    await database.query('DELETE FROM products');
    const repository = new ProductRepository();
    let embeddingCalls = 0;
    const vector = Array.from({ length: 384 }, (_, index) => index === 0 ? 1 : 0);
    const provider: EmbeddingProvider = {
      model: 'integration-model',
      dimensions: 384,
      embed: async () => { embeddingCalls += 1; return vector; },
      warm: async () => undefined,
      isReady: () => true
    };
    const input: ProductInput = {
      sku: 'INTEGRATION-PRODUCT', name: 'Integration Product',
      description: 'A complete product description used to verify update behavior.',
      category: 'Test', tags: ['integration'], price: '20.00', active: true
    };
    const text = canonicalProductText(input);
    await repository.upsertSeed(input, vector, 384, provider.model, contentHash(text));
    const product = (await repository.list(1, 10)).products[0];
    expect(product).toBeDefined();
    const service = new ProductService(repository, provider);
    const before = await repository.catalogVersion();

    const priceOnly = await service.update(product!.id, { price: '21.00' });
    expect(priceOnly.price).toBe('21.00');
    expect(embeddingCalls).toBe(0);
    expect(await repository.catalogVersion()).toBe(before + 1);

    const searchable = await service.update(product!.id, { name: 'Updated Integration Product' });
    expect(searchable.embeddingContentHash).not.toBe(product!.embeddingContentHash);
    expect(embeddingCalls).toBe(1);
    expect(await repository.catalogVersion()).toBe(before + 2);
  });
});
