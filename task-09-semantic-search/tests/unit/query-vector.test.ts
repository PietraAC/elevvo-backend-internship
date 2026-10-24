import { AppError } from '../../src/errors/app-error.js';
import { normalizeQuery, parseLimit } from '../../src/modules/search/query.js';
import { serializeVector, similarityFromDistance, validateVector } from '../../src/modules/search/vector.js';
import { getEmbeddingProvider } from '../../src/modules/search/embedding-provider.js';

describe('query validation', () => {
  it('normalizes whitespace and hashes the lowercase cache form', () => {
    const first = normalizeQuery('  Warm   Hiking Jacket ');
    const second = normalizeQuery('warm hiking jacket');
    expect(first.display).toBe('Warm Hiking Jacket');
    expect(first.hash).toBe(second.hash);
    expect(first.hash).not.toContain('warm');
  });

  it.each([undefined, '', '  ', 'ab', 'x'.repeat(301)])('rejects invalid query %p', (query) => {
    expect(() => normalizeQuery(query)).toThrow(AppError);
  });

  it('validates the result limit', () => {
    expect(parseLimit(undefined)).toBe(5);
    expect(parseLimit('20')).toBe(20);
    expect(() => parseLimit('0')).toThrow(AppError);
    expect(() => parseLimit('2.5')).toThrow(AppError);
  });
});

describe('vector helpers', () => {
  it('validates and serializes finite vectors', () => {
    expect(validateVector([0.1, 0.2], 2)).toEqual([0.1, 0.2]);
    expect(serializeVector([0.1, 0.2], 2)).toBe('[0.1,0.2]');
  });

  it('rejects invalid dimensions and non-finite values', () => {
    expect(() => validateVector([0.1], 2)).toThrow(AppError);
    expect(() => validateVector([Number.NaN, 0.2], 2)).toThrow(AppError);
  });

  it('clamps and rounds similarity', () => {
    expect(similarityFromDistance(-0.2)).toBe(1);
    expect(similarityFromDistance(0.123456)).toBe(0.8765);
    expect(similarityFromDistance(2)).toBe(0);
  });
});

describe('embedding provider lifecycle', () => {
  it('returns one shared provider instance for concurrent callers', () => {
    expect(getEmbeddingProvider()).toBe(getEmbeddingProvider());
  });
});
