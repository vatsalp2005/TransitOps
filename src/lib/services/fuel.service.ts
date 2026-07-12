import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { recordAudit } from "./audit";
import type { FuelCreateInput } from "@/lib/validation/fuel";

const include = {
  vehicle: { select: { id: true, registrationNo: true, name: true } },
  trip: { select: { id: true, code: true } },
} satisfies Prisma.FuelLogInclude;

export function listFuelLogs(vehicleId?: string) {
  return prisma.fuelLog.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include,
    orderBy: { filledAt: "desc" },
  });
}

export async function createFuelLog(input: FuelCreateInput, actorId?: string | null) {
  const log = await prisma.fuelLog.create({
    data: {
      vehicleId: input.vehicleId,
      tripId: input.tripId ?? null,
      liters: input.liters,
      cost: input.cost,
      odometerKm: input.odometerKm,
      filledAt: input.filledAt ?? new Date(),
    },
    include,
  });
  await recordAudit(prisma, {
    entity: "FuelLog",
    entityId: log.id,
    action: "CREATE",
    summary: `Logged ${input.liters} L fuel for ${log.vehicle.registrationNo}`,
    actorId,
  });
  return log;
}
