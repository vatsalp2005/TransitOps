import { z } from "zod";

export const fuelCreateSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  tripId: z.string().optional().nullable(),
  liters: z.coerce.number().positive("Liters must be greater than 0").max(10000),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  odometerKm: z.coerce.number().int().min(0).optional(),
  filledAt: z.coerce.date().optional(),
});

export type FuelCreateInput = z.infer<typeof fuelCreateSchema>;
