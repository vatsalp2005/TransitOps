import { z } from "zod";

export const tripCreateSchema = z.object({
  source: z.string().trim().min(2, "Source is required").max(80),
  destination: z.string().trim().min(2, "Destination is required").max(80),
  vehicleId: z.string().min(1, "Select a vehicle"),
  driverId: z.string().min(1, "Select a driver"),
  cargoWeightKg: z.coerce.number().positive("Cargo weight must be greater than 0").max(200000),
  plannedDistance: z.coerce.number().positive("Distance must be greater than 0").max(100000),
  revenue: z.coerce.number().min(0).default(0),
});

export const tripUpdateSchema = tripCreateSchema.partial();

/** Payload when completing a trip: final odometer + fuel consumed. */
export const tripCompleteSchema = z.object({
  endOdometer: z.coerce.number().int().min(0),
  fuelConsumedL: z.coerce.number().min(0),
  revenue: z.coerce.number().min(0).optional(),
});

export type TripCreateInput = z.infer<typeof tripCreateSchema>;
export type TripCompleteInput = z.infer<typeof tripCompleteSchema>;
