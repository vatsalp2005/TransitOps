import { z } from "zod";
import { MaintenanceType } from "@prisma/client";

export const maintenanceCreateSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  type: z.nativeEnum(MaintenanceType),
  description: z.string().trim().min(3, "Describe the work").max(240),
  cost: z.coerce.number().min(0).default(0),
  odometerKm: z.coerce.number().int().min(0).optional(),
});

export type MaintenanceCreateInput = z.infer<typeof maintenanceCreateSchema>;
