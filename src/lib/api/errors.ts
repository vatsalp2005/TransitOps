/**
 * Typed application error. Thrown from the service layer and translated into a
 * consistent JSON response shape by the route handler wrapper.
 */
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, opts?: { status?: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "AppError";
    this.status = opts?.status ?? 400;
    this.code = opts?.code ?? "BAD_REQUEST";
    this.details = opts?.details;
  }
}

/** 400 — business rule / validation violation. */
export const badRequest = (message: string, details?: unknown) =>
  new AppError(message, { status: 400, code: "BAD_REQUEST", details });

/** 401 — not authenticated. */
export const unauthorized = (message = "Authentication required") =>
  new AppError(message, { status: 401, code: "UNAUTHORIZED" });

/** 403 — authenticated but not permitted. */
export const forbidden = (message = "You do not have permission to do this") =>
  new AppError(message, { status: 403, code: "FORBIDDEN" });

/** 404 — resource not found. */
export const notFound = (message = "Not found") =>
  new AppError(message, { status: 404, code: "NOT_FOUND" });

/** 409 — conflict (e.g. unique constraint, illegal state transition). */
export const conflict = (message: string, details?: unknown) =>
  new AppError(message, { status: 409, code: "CONFLICT", details });
