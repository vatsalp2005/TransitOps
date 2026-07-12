import { prisma } from "@/lib/db";
import { Prisma, DriverStatus } from "@prisma/client";
import { badRequest, notFound } from "@/lib/api/errors";
import { recordAudit } from "./audit";
import type { DriverCreateInput, DriverUpdateInput } from "@/lib/validation/driver";

export type DriverFilters = { status?: DriverStatus; search?: string };

/** Start of today — licenses expiring before this are considered expired. */
function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isLicenseExpired(expiry: Date) {
  return expiry.getTime() < today().getTime();
}

export function listDrivers(filters: DriverFilters = {}) {
  const where: Prisma.DriverWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { licenseNo: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return prisma.driver.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getDriver(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw notFound("Driver not found");
  return driver;
}

/**
 * Drivers eligible for dispatch: AVAILABLE, not suspended, license not expired.
 * Enforces the "expired license / suspended cannot be assigned" business rule.
 */
export function assignableDrivers() {
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.AVAILABLE,
      licenseExpiry: { gte: today() },
    },
    orderBy: { name: "asc" },
  });
}

export async function createDriver(input: DriverCreateInput, actorId?: string | null) {
  const driver = await prisma.driver.create({
    data: {
      name: input.name,
      licenseNo: input.licenseNo,
      licenseCategory: input.licenseCategory,
      licenseExpiry: input.licenseExpiry,
      contact: input.contact,
      safetyScore: input.safetyScore ?? 100,
      status: input.status ?? DriverStatus.AVAILABLE,
    },
  });
  await recordAudit(prisma, {
    entity: "Driver",
    entityId: driver.id,
    action: "CREATE",
    summary: `Added driver ${driver.name} (${driver.licenseNo})`,
    actorId,
  });
  return driver;
}

/** Default reminder window: licences expiring within this many days. */
export const EXPIRY_WINDOW_DAYS = 30;

/**
 * Drivers whose licence has expired or expires within `days`.
 * Ordered soonest-first so the most urgent compliance risk surfaces at the top.
 */
export function expiringLicenses(days = EXPIRY_WINDOW_DAYS) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() + days);

  return prisma.driver.findMany({
    where: {
      licenseExpiry: { lte: cutoff },
      status: { not: DriverStatus.SUSPENDED },
    },
    orderBy: { licenseExpiry: "asc" },
  });
}

/**
 * Update a driver.
 *
 * Suspension is a compliance event, not just a status flip: a reason is required,
 * the moment of suspension is recorded, and it is written to the audit trail.
 * Lifting a suspension clears both fields.
 */
export async function updateDriver(id: string, input: DriverUpdateInput, actorId?: string | null) {
  const current = await getDriver(id);

  const data: Prisma.DriverUpdateInput = { ...input };
  let summary = `Updated driver ${current.name}`;

  const becomingSuspended =
    input.status === DriverStatus.SUSPENDED && current.status !== DriverStatus.SUSPENDED;
  const liftingSuspension =
    input.status != null &&
    input.status !== DriverStatus.SUSPENDED &&
    current.status === DriverStatus.SUSPENDED;

  if (becomingSuspended) {
    const reason = input.suspensionReason?.trim();
    if (!reason) {
      throw badRequest("A reason is required to suspend a driver.", [
        { path: "suspensionReason", message: "Give a reason for the suspension." },
      ]);
    }
    data.suspensionReason = reason;
    data.suspendedAt = new Date();
    summary = `Suspended ${current.name}: ${reason}`;
  }

  if (liftingSuspension) {
    data.suspensionReason = null;
    data.suspendedAt = null;
    summary = `Lifted suspension on ${current.name}`;
  }

  const driver = await prisma.driver.update({ where: { id }, data });

  await recordAudit(prisma, {
    entity: "Driver",
    entityId: id,
    action: "UPDATE",
    summary,
    actorId,
  });
  return driver;
}
