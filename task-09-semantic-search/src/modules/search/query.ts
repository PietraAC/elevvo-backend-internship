import { createHash } from 'node:crypto';
import { AppError } from '../../errors/app-error.js';
import { collapseWhitespace } from '../products/product-text.js';

export interface NormalizedQuery {
  display: string;
  cacheValue: string;
  hash: string;
}

export function normalizeQuery(value: unknown): NormalizedQuery {
  if (typeof value !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'The search query must contain between 3 and 300 characters.');
  }

  const display = collapseWhitespace(value);
  const containsVisibleText = /[^\p{C}\s]/u.test(display);
  if (!containsVisibleText || display.length < 3 || display.length > 300) {
    throw new AppError(400, 'VALIDATION_ERROR', 'The search query must contain between 3 and 300 characters.');
  }

  const cacheValue = display.toLocaleLowerCase('en-US');
  return {
    display,
    cacheValue,
    hash: createHash('sha256').update(cacheValue).digest('hex')
  };
}

export function parseLimit(value: unknown): number {
  if (value === undefined) return 5;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'The result limit must be an integer between 1 and 20.');
  }
  const limit = Number(value);
  if (limit < 1 || limit > 20) {
    throw new AppError(400, 'VALIDATION_ERROR', 'The result limit must be an integer between 1 and 20.');
  }
  return limit;
}
