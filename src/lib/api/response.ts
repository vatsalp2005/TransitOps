import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "./errors";

/**
 * Uniform API envelope. Every endpoint returns { ok, data } or { ok, error }.
 */
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};

/**
 * Recursively convert Prisma Decimals to numbers and Dates to ISO strings so the
 * client receives clean, chart-ready JSON (no Decimal string surprises).
 */
export function serialize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serialize(v);
    }
    return out;
  }
  return value;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data: serialize(data) as T }, init);
}

export function fail(error: ApiFailure["error"], status: number) {
  return NextResponse.json<ApiFailure>({ ok: false, error }, { status });
}

/** Translate any thrown value into the standard failure envelope. */
export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return fail({ code: err.code, message: err.message, details: err.details }, err.status);
  }

  if (err instanceof ZodError) {
    return fail(
      {
        code: "VALIDATION_ERROR",
        message: "Some fields are invalid.",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      422,
    );
  }

  // Prisma unique-constraint / FK violations -> friendly messages.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Translate DB column names into something a human recognises.
      const FRIENDLY: Record<string, string> = {
        registration_no: "registration number",
        license_no: "licence number",
        email: "email address",
        code: "trip code",
      };
      const cols = (err.meta?.target as string[] | undefined) ?? [];
      const label = cols.map((c) => FRIENDLY[c] ?? c.replace(/_/g, " ")).join(", ") || "value";
      return fail(
        { code: "CONFLICT", message: `That ${label} is already registered.` },
        409,
      );
    }
    if (err.code === "P2025") {
      return fail({ code: "NOT_FOUND", message: "The requested record does not exist." }, 404);
    }
    if (err.code === "P2003") {
      return fail({ code: "CONFLICT", message: "This record is referenced by other data." }, 409);
    }
  }

  console.error("[unhandled]", err);
  return fail({ code: "INTERNAL_ERROR", message: "Something went wrong on our end." }, 500);
}
