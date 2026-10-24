import { jest } from '@jest/globals';
import request from 'supertest';
import { buildApp } from '../../src/app.js';
import type { ProductRepository } from '../../src/modules/products/product.repository.js';
import type { ProductRecord } from '../../src/modules/products/product.types.js';
import type { EmbeddingProvider } from '../../src/modules/search/embedding-provider.js';
import type { NormalizedQuery } from '../../src/modules/search/query.js';
import type { SearchResponseData, SemanticSearchService } from '../../src/modules/search/search.service.js';

const embeddings: EmbeddingProvider = { model: 'test-model', dimensions: 2, embed: async () => [0.5, 0.5], warm: async () => undefined, isReady: () => true };
const repository = {
  list: jest.fn<(page: number, pageSize: number) => Promise<{ products: ProductRecord[]; total: number }>>().mockResolvedValue({ products: [], total: 0 }),
  findById: jest.fn<(id: string) => Promise<ProductRecord | undefined>>().mockResolvedValue(undefined)
} as unknown as ProductRepository;
const searchService: SemanticSearchService = {
  search: jest.fn<(query: NormalizedQuery, limit: number) => Promise<SearchResponseData>>().mockResolvedValue({ data: [], meta: { query: 'warm hiking jacket', limit: 5, resultCount: 0, cache: { status: 'MISS', ttlSeconds: 300 }, timing: { totalMs: 4, embeddingMs: 2, databaseMs: 1, cacheMs: 1 }, model: 'test-model', catalogVersion: 1 } })
};
const app = buildApp({ productRepository: repository, embeddingProvider: embeddings, searchService, readinessCheck: async () => true });

describe('HTTP API', () => {
  it('returns liveness, readiness, and request IDs', async () => {
    const live = await request(app).get('/health/live').expect(200);
    expect(live.headers['x-request-id']).toBeDefined();
    await request(app).get('/health/ready').expect(200).expect(({ body }) => expect(body.status).toBe('READY'));
  });

  it('validates search and returns timing headers', async () => {
    const response = await request(app).get('/api/products/search').query({ q: 'warm hiking jacket' }).expect(200);
    expect(response.headers['server-timing']).toContain('embedding');
    expect(response.body.meta.requestId).toBe(response.headers['x-request-id']);
    await request(app).get('/api/products/search').query({ q: 'x' }).expect(400).expect(({ body }) => expect(body.error.code).toBe('VALIDATION_ERROR'));
  });

  it('serves the demonstration page and assets', async () => {
    await request(app).get('/demo').expect(200).expect('Content-Type', /html/).expect(/Semantic Search Lab/);
    await request(app).get('/demo/assets/styles.css').expect(200).expect('Content-Type', /css/);
  });

  it('returns the catalog without vector data', async () => {
    const response = await request(app).get('/api/products').expect(200);
    expect(JSON.stringify(response.body)).not.toContain('embeddingContentHash');
    expect(JSON.stringify(response.body)).not.toContain('embedding_model');
  });
});
