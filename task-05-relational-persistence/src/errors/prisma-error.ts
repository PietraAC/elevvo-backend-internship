import { AppError } from "./app-error.js";

type ErrorWithCode = Error & { code?: string; meta?: unknown };

export function mapPersistenceError(error: unknown): AppError | undefined {
  if (!(error instanceof Error)) return undefined;

  const persistenceError = error as ErrorWithCode;

  if (persistenceError.code === "P2002") {
    return new AppError(
      409,
      "UNIQUE_CONSTRAINT_VIOLATION",
      "A record with the same unique value already exists"
    );
  }

  if (persistenceError.code === "P2025") {
    return new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found");
  }

  if (persistenceError.code === "P2034") {
    return new AppError(
      409,
      "TRANSACTION_CONFLICT",
      "The operation conflicted with another transaction"
    );
  }

  if (["P1000", "P1001", "P1002", "P1003"].includes(persistenceError.code ?? "")) {
    return new AppError(
      503,
      "DATABASE_UNAVAILABLE",
      "The database is temporarily unavailable"
    );
  }

  return undefined;
}

export function hasPrismaCode(error: unknown, code: string): boolean {
  return error instanceof Error && (error as ErrorWithCode).code === code;
}
