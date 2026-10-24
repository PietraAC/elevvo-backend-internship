import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { ProductRepository } from '../products/product.repository.js';
import type { SearchProduct } from '../products/product.types.js';
import type { EmbeddingProvider } from './embedding-provider.js';
import type { CacheStatus, SearchResultCache } from './search-cache.js';
import type { NormalizedQuery } from './query.js';

export interface SearchTimings {
  totalMs: number;
  embeddingMs: number;
  databaseMs: number;
  cacheMs: number;
}

export interface SearchResponseData {
  data: SearchProduct[];
  meta: {
    query: string;
    limit: number;
    resultCount: number;
    cache: {
      status: CacheStatus;
      ttlSeconds: number;
      ttlRemainingSeconds?: number;
    };
    timing: SearchTimings;
    model: string;
    catalogVersion: number;
  };
}

export interface SemanticSearchService {
  search(query: NormalizedQuery, limit: number): Promise<SearchResponseData>;
}

const roundTiming = (value: number) => Math.round(value * 10) / 10;

export class DefaultSemanticSearchService implements SemanticSearchService {
  private readonly inFlight = new Map<string, Promise<SearchResponseData>>();
  private readonly modelFingerprint: string;

  constructor(
    private readonly products: ProductRepository,
    private readonly embeddings: EmbeddingProvider,
    private readonly cache: SearchResultCache
  ) {
    this.modelFingerprint = createHash('sha256').update(`${embeddings.model}:${embeddings.dimensions}`).digest('hex').slice(0, 12);
  }

  async search(query: NormalizedQuery, limit: number): Promise<SearchResponseData> {
    const catalogVersion = await this.products.catalogVersion();
    const key = `task09:search:v1:${this.modelFingerprint}:${catalogVersion}:${limit}:${query.hash}`;
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const operation = this.execute(query, limit, catalogVersion, key);
    this.inFlight.set(key, operation);
    try {
      return await operation;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private async execute(
    query: NormalizedQuery,
    limit: number,
    catalogVersion: number,
    key: string
  ): Promise<SearchResponseData> {
    const started = performance.now();
    const cacheStarted = performance.now();
    const cached = await this.cache.get(key);
    let cacheMs = performance.now() - cacheStarted;

    if (cached.status === 'HIT' && cached.payload) {
      const totalMs = performance.now() - started;
      return {
        data: cached.payload.results,
        meta: {
          query: query.display,
          limit,
          resultCount: cached.payload.results.length,
          cache: {
            status: 'HIT',
            ttlSeconds: this.cache.ttlSeconds,
            ...(cached.ttlRemainingSeconds === undefined ? {} : { ttlRemainingSeconds: cached.ttlRemainingSeconds })
          },
          timing: { totalMs: roundTiming(totalMs), embeddingMs: 0, databaseMs: 0, cacheMs: roundTiming(cacheMs) },
          model: cached.payload.model,
          catalogVersion: cached.payload.catalogVersion
        }
      };
    }

    const embeddingStarted = performance.now();
    const vector = await this.embeddings.embed(query.display);
    const embeddingMs = performance.now() - embeddingStarted;

    const databaseStarted = performance.now();
    const results = await this.products.search(vector, this.embeddings.dimensions, limit);
    const databaseMs = performance.now() - databaseStarted;

    let status: CacheStatus = cached.status;
    if (status === 'MISS') {
      const writeStarted = performance.now();
      const stored = await this.cache.set(key, { results, model: this.embeddings.model, catalogVersion });
      cacheMs += performance.now() - writeStarted;
      if (!stored) status = 'BYPASS';
    }

    const totalMs = performance.now() - started;
    return {
      data: results,
      meta: {
        query: query.display,
        limit,
        resultCount: results.length,
        cache: { status, ttlSeconds: this.cache.ttlSeconds },
        timing: {
          totalMs: roundTiming(totalMs),
          embeddingMs: roundTiming(embeddingMs),
          databaseMs: roundTiming(databaseMs),
          cacheMs: roundTiming(cacheMs)
        },
        model: this.embeddings.model,
        catalogVersion
      }
    };
  }
}
