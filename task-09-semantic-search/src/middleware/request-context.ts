import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestContext(request: Request, response: Response, next: NextFunction): void {
  const supplied = request.header('x-request-id');
  const requestId = supplied && /^[A-Za-z0-9._-]{1,100}$/.test(supplied) ? supplied : randomUUID();
  response.locals.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  next();
}
