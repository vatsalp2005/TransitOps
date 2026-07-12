import { z } from "zod";
import { RoleKey } from "@prisma/client";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.coerce.boolean().optional().default(false),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email,
  password,
  role: z.nativeEnum(RoleKey),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  password,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
