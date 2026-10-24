import { AppError } from '../../errors/app-error.js';

export function validateVector(values: readonly number[], dimensions: number): number[] {
  if (values.length !== dimensions || values.some((value) => !Number.isFinite(value))) {
    throw new AppError(503, 'EMBEDDING_UNAVAILABLE', `The embedding must contain ${dimensions} finite values.`);
  }
  return [...values];
}

export function serializeVector(values: readonly number[], dimensions: number): string {
  return `[${validateVector(values, dimensions).join(',')}]`;
}

export function similarityFromDistance(distance: number): number {
  return Math.round(Math.max(0, Math.min(1, 1 - distance)) * 10_000) / 10_000;
}
