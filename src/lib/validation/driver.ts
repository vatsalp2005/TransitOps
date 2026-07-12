import { z } from "zod";
import { LicenseCategory, DriverStatus } from "@prisma/client";

export const driverCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  licenseNo: z
    .string()
    .trim()
    .min(4, "License number is too short")
    .max(24)
    .transform((s) => s.toUpperCase()),
  licenseCategory: z.nativeEnum(LicenseCategory),
  licenseExpiry: z.coerce.date(),
  contact: z
    .string()
    .trim()
    .min(7, "Enter a valid contact number")
    .max(20)
    .regex(/^[+0-9 ()-]+$/, "Contact number has invalid characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  safetyScore: z.coerce.number().int().min(0).max(100).default(100),
  status: z.nativeEnum(DriverStatus).optional(),
  /** Required by the service when moving a driver to SUSPENDED. */
  suspensionReason: z.string().trim().max(240).optional(),
});

export const driverUpdateSchema = driverCreateSchema.partial();

export type DriverCreateInput = z.infer<typeof driverCreateSchema>;
export type DriverUpdateInput = z.infer<typeof driverUpdateSchema>;
