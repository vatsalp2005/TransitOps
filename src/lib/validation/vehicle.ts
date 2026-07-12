import { z } from "zod";
import { VehicleType, VehicleStatus, Region } from "@prisma/client";

export const vehicleCreateSchema = z.object({
  registrationNo: z
    .string()
    .trim()
    .min(3, "Registration number is too short")
    .max(20)
    .transform((s) => s.toUpperCase()),
  name: z.string().trim().min(2, "Name is required").max(80),
  type: z.nativeEnum(VehicleType),
  maxLoadKg: z.coerce.number().positive("Load capacity must be greater than 0").max(200000),
  odometerKm: z.coerce.number().int().min(0).default(0),
  acquisitionCost: z.coerce.number().min(0, "Cost cannot be negative"),
  region: z.nativeEnum(Region),
  status: z.nativeEnum(VehicleStatus).optional(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
