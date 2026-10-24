import { config } from '../../config/env.js';
import { getRedisClient } from '../../lib/redis.js';
import type { SearchProduct } from '../products/product.types.js';

export type CacheStatus = 'HIT' | 'MISS' | 'BYPASS';

export interface CachedSearch {
  results: SearchProduct[];
  model: string;
  catalogVersion: number;
}

export interface CacheLookup {
  status: CacheStatus;
  payload?: CachedSearch;
  ttlRemainingSeconds?: number;
}

export interface SearchResultCache {
  get(key: string): Promise<CacheLookup>;
  set(key: string, payload: CachedSearch): Promise<boolean>;
  readonly ttlSeconds: number;
}

function isCachedSearch(value: unknown): value is CachedSearch {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<CachedSearch>;
  return Array.isArray(candidate.results) && typeof candidate.model === 'string' && Number.isInteger(candidate.catalogVersion);
}

export class RedisSearchResultCache implements SearchResultCache {
  readonly ttlSeconds = config.SEARCH_CACHE_TTL_SECONDS;

  async get(key: string): Promise<CacheLookup> {
    const client = await getRedisClient();
    if (!client) return { status: 'BYPASS' };

    try {
      const value = await client.get(key);
      if (value === null) return { status: 'MISS' };

      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        await client.del(key).catch(() => undefined);
        return { status: 'BYPASS' };
      }

      if (!isCachedSearch(parsed)) {
        await client.del(key).catch(() => undefined);
        return { status: 'BYPASS' };
      }

      const ttl = await client.ttl(key);
      return {
        status: 'HIT',
        payload: parsed,
        ttlRemainingSeconds: Math.max(0, ttl)
      };
    } catch {
      return { status: 'BYPASS' };
    }
  }

  async set(key: string, payload: CachedSearch): Promise<boolean> {
    const client = await getRedisClient();
    if (!client) return false;
    try {
      await client.set(key, JSON.stringify(payload), { EX: this.ttlSeconds });
      return true;
    } catch {
      return false;
    }
  }
}
