import { jest } from '@jest/globals';
import type { ProductRepository } from '../../src/modules/products/product.repository.js';
import type { SearchProduct } from '../../src/modules/products/product.types.js';
import type { EmbeddingProvider } from '../../src/modules/search/embedding-provider.js';
import { normalizeQuery } from '../../src/modules/search/query.js';
import type { CachedSearch, CacheLookup, SearchResultCache } from '../../src/modules/search/search-cache.js';
import { DefaultSemanticSearchService } from '../../src/modules/search/search.service.js';

const product: SearchProduct = { id: '1', sku: 'TEST-1', name: 'Test Product', description: 'A useful product description.', category: 'Test', tags: ['test'], price: '10.00', similarity: 0.9 };

function setup(initialCache?: CachedSearch, bypass = false) {
  let stored = initialCache;
  const catalogVersion = jest.fn<() => Promise<number>>().mockResolvedValue(3);
  const repositorySearch = jest.fn<(vector: readonly number[], dimensions: number, limit: number) => Promise<SearchProduct[]>>().mockResolvedValue([product]);
  const repository = { catalogVersion, search: repositorySearch } as unknown as ProductRepository;
  const embed = jest.fn<(text: string) => Promise<number[]>>().mockResolvedValue([0.5, 0.5]);
  const warm = jest.fn<() => Promise<void>>().mockResolvedValue();
  const embeddings: EmbeddingProvider = { model: 'test-model', dimensions: 2, embed, warm, isReady: () => true };
  const cache: SearchResultCache = {
    ttlSeconds: 300,
    get: jest.fn<(key: string) => Promise<CacheLookup>>(async () => bypass ? { status: 'BYPASS' } : stored ? { status: 'HIT', payload: stored, ttlRemainingSeconds: 250 } : { status: 'MISS' }),
    set: jest.fn<(key: string, payload: CachedSearch) => Promise<boolean>>(async (_key, payload) => { stored = payload; return true; })
  };
  return { service: new DefaultSemanticSearchService(repository, embeddings, cache), repository, embeddings, cache };
}

describe('semantic search service', () => {
  it('computes a MISS and stores the stable payload', async () => {
    const fixture = setup();
    const response = await fixture.service.search(normalizeQuery('useful test product'), 5);
    expect(response.meta.cache.status).toBe('MISS');
    expect(fixture.embeddings.embed).toHaveBeenCalledTimes(1);
    expect(fixture.repository.search).toHaveBeenCalledTimes(1);
    expect(fixture.cache.set).toHaveBeenCalledTimes(1);
    const cacheKey = (fixture.cache.get as ReturnType<typeof jest.fn>).mock.calls[0]?.[0] as string;
    expect(cacheKey).toMatch(/^task09:search:v1:/);
    expect(cacheKey).not.toContain('useful test product');
  });

  it('returns a HIT without embedding or database work', async () => {
    const fixture = setup({ results: [product], model: 'test-model', catalogVersion: 3 });
    const response = await fixture.service.search(normalizeQuery('useful test product'), 5);
    expect(response.meta.cache.status).toBe('HIT');
    expect(response.meta.timing.embeddingMs).toBe(0);
    expect(fixture.embeddings.embed).not.toHaveBeenCalled();
    expect(fixture.repository.search).not.toHaveBeenCalled();
  });

  it('continues in BYPASS mode when cache is unavailable', async () => {
    const fixture = setup(undefined, true);
    const response = await fixture.service.search(normalizeQuery('useful test product'), 5);
    expect(response.meta.cache.status).toBe('BYPASS');
    expect(response.data).toEqual([product]);
    expect(fixture.cache.set).not.toHaveBeenCalled();
  });

  it('collapses simultaneous identical misses', async () => {
    const fixture = setup();
    await Promise.all([fixture.service.search(normalizeQuery('same concurrent query'), 5), fixture.service.search(normalizeQuery('same concurrent query'), 5)]);
    expect(fixture.embeddings.embed).toHaveBeenCalledTimes(1);
    expect(fixture.repository.search).toHaveBeenCalledTimes(1);
  });
});
