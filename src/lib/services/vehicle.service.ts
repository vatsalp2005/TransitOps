import { prisma } from "@/lib/db";
import { Prisma, VehicleStatus, VehicleType, Region } from "@prisma/client";
import { conflict, notFound } from "@/lib/api/errors";
import { recordAudit } from "./audit";
import type { VehicleCreateInput, VehicleUpdateInput } from "@/lib/validation/vehicle";

export type VehicleFilters = {
  type?: VehicleType;
  status?: VehicleStatus;
  region?: Region;
  search?: string;
};

export function listVehicles(filters: VehicleFilters = {}) {
  const where: Prisma.VehicleWhereInput = {};
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.region) where.region = filters.region;
  if (filters.search) {
    where.OR = [
      { registrationNo: { contains: filters.search, mode: "insensitive" } },
      { name: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return prisma.vehicle.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw notFound("Vehicle not found");
  return vehicle;
}

/** Vehicles eligible for dispatch: strictly AVAILABLE (never In Shop/Retired/On Trip). */
export function selectableVehicles() {
  return prisma.vehicle.findMany({
    where: { status: VehicleStatus.AVAILABLE },
    orderBy: { registrationNo: "asc" },
  });
}

export async function createVehicle(input: VehicleCreateInput, actorId?: string | null) {
  // Registration numbers are unique. Check up-front so we can return a clear,
  // field-targeted message instead of a raw unique-constraint violation.
  const existing = await prisma.vehicle.findUnique({
    where: { registrationNo: input.registrationNo },
  });
  if (existing) {
    throw conflict(`${input.registrationNo} is already registered (${existing.name}).`, [
      { path: "registrationNo", message: "This vehicle is already registered." },
    ]);
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNo: input.registrationNo,
      name: input.name,
      type: input.type,
      maxLoadKg: input.maxLoadKg,
      odometerKm: input.odometerKm ?? 0,
      acquisitionCost: input.acquisitionCost,
      region: input.region,
      status: input.status ?? VehicleStatus.AVAILABLE,
    },
  });
  await recordAudit(prisma, {
    entity: "Vehicle",
    entityId: vehicle.id,
    action: "CREATE",
    summary: `Registered vehicle ${vehicle.registrationNo} (${vehicle.name})`,
    actorId,
  });
  return vehicle;
}

export async function updateVehicle(
  id: string,
  input: VehicleUpdateInput,
  actorId?: string | null,
) {
  const current = await getVehicle(id);

  // Renaming onto another vehicle's registration number is a conflict, not a crash.
  if (input.registrationNo && input.registrationNo !== current.registrationNo) {
    const clash = await prisma.vehicle.findUnique({
      where: { registrationNo: input.registrationNo },
    });
    if (clash) {
      throw conflict(`${input.registrationNo} is already registered (${clash.name}).`, [
        { path: "registrationNo", message: "This vehicle is already registered." },
      ]);
    }
  }

  const vehicle = await prisma.vehicle.update({ where: { id }, data: input });
  await recordAudit(prisma, {
    entity: "Vehicle",
    entityId: id,
    action: "UPDATE",
    summary: `Updated vehicle ${vehicle.registrationNo}`,
    actorId,
  });
  return vehicle;
}

/** Retire a vehicle (soft): keeps history but removes it from all operations. */
export async function retireVehicle(id: string, actorId?: string | null) {
  const vehicle = await getVehicle(id);
  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw conflict("Cannot retire a vehicle that is currently on a trip.");
  }
  const updated = await prisma.vehicle.update({
    where: { id },
    data: { status: VehicleStatus.RETIRED },
  });
  await recordAudit(prisma, {
    entity: "Vehicle",
    entityId: id,
    action: "UPDATE",
    summary: `Retired vehicle ${vehicle.registrationNo}`,
    actorId,
  });
  return updated;
}
