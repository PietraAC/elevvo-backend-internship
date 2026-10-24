import { performance } from 'node:perf_hooks';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

export function requestLogger(request: Request, response: Response, next: NextFunction): void {
  const started = performance.now();
  response.on('finish', () => {
    logger.info('http_request', {
      requestId: response.locals.requestId,
      method: request.method,
      route: request.route?.path ?? request.path,
      statusCode: response.statusCode,
      totalMs: Math.round((performance.now() - started) * 10) / 10,
      cacheStatus: response.locals.cacheStatus,
      resultCount: response.locals.resultCount,
      catalogVersion: response.locals.catalogVersion
    });
  });
  next();
}
