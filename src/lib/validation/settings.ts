import { z } from "zod";
import { RoleKey } from "@prisma/client";

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
  role: z.nativeEnum(RoleKey),
});

/** Reassign a role, or activate/deactivate/unlock an account. */
export const userUpdateSchema = z.object({
  role: z.nativeEnum(RoleKey).optional(),
  isActive: z.boolean().optional(),
  unlock: z.boolean().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
