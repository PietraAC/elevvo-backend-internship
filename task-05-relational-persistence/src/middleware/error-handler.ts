import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { mapPersistenceError } from "../errors/prisma-error.js";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "The request contains invalid data",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      })),
      requestId: request.requestId
    });
    return;
  }

  const appError = error instanceof AppError ? error : mapPersistenceError(error);

  if (appError) {
    response.status(appError.statusCode).json({
      code: appError.code,
      message: appError.message,
      ...(appError.details ? { details: appError.details } : {}),
      requestId: request.requestId
    });
    return;
  }

  console.error("Unhandled request error", {
    requestId: request.requestId,
    method: request.method,
    path: request.path,
    error: error instanceof Error ? error.message : "Unknown error"
  });

  response.status(500).json({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    requestId: request.requestId
  });
};
