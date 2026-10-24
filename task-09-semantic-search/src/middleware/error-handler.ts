import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, asAppError } from '../errors/app-error.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, 'PRODUCT_NOT_FOUND', 'The requested resource was not found.'));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const appError =
    error instanceof ZodError
      ? new AppError(400, 'VALIDATION_ERROR', 'The request contains invalid data.', error.issues)
      : asAppError(error);

  logger[appError.status >= 500 ? 'error' : 'warn']('request_error', {
    requestId: response.locals.requestId,
    code: appError.code,
    statusCode: appError.status
  });

  response.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      requestId: response.locals.requestId
    }
  });
};
