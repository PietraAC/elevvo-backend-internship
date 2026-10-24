export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'SKU_CONFLICT'
  | 'EMBEDDING_UNAVAILABLE'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details: unknown[] = []
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === '23505') {
      return new AppError(409, 'SKU_CONFLICT', 'A product with this SKU already exists.');
    }

    const databaseCodes = new Set(['ECONNREFUSED', '57P01', '57P02', '57P03']);
    if (typeof error.code === 'string' && databaseCodes.has(error.code)) {
      return new AppError(503, 'DATABASE_UNAVAILABLE', 'The product database is unavailable.');
    }
  }

  return new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
}
