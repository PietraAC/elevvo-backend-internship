import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestContext(request: Request, response: Response, next: NextFunction): void {
  const startedAt = performance.now();
  const requestIdHeader = request.header("x-request-id");
  request.requestId = requestIdHeader?.trim() || randomUUID();
  response.setHeader("x-request-id", request.requestId);

  response.on("finish", () => {
    console.info(
      JSON.stringify({
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Number((performance.now() - startedAt).toFixed(2))
      })
    );
  });

  next();
}
