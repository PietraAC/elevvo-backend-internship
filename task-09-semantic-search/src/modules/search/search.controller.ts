import type { NextFunction, Request, Response } from 'express';
import type { SemanticSearchService } from './search.service.js';
import { normalizeQuery, parseLimit } from './query.js';

export class SearchController {
  constructor(private readonly searchService: SemanticSearchService) {}

  search = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query = normalizeQuery(request.query.q);
      const limit = parseLimit(request.query.limit);
      const result = await this.searchService.search(query, limit);
      const requestId = response.locals.requestId as string;
      response.locals.cacheStatus = result.meta.cache.status;
      response.locals.resultCount = result.meta.resultCount;
      response.locals.catalogVersion = result.meta.catalogVersion;
      response.setHeader(
        'Server-Timing',
        `cache;dur=${result.meta.timing.cacheMs}, embedding;dur=${result.meta.timing.embeddingMs}, db;dur=${result.meta.timing.databaseMs}, total;dur=${result.meta.timing.totalMs}`
      );
      response.json({ ...result, meta: { ...result.meta, requestId } });
    } catch (error) {
      next(error);
    }
  };
}
