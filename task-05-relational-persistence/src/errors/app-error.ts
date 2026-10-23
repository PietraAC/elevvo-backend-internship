export type ErrorDetails = ReadonlyArray<{
  path: string;
  message: string;
}>;

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetails
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (resource: string): AppError =>
  new AppError(404, "RESOURCE_NOT_FOUND", `${resource} not found`);

export const conflict = (code: string, message: string): AppError =>
  new AppError(409, code, message);
