import { z } from "zod";
import { ExpenseType } from "@prisma/client";

export const expenseCreateSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  tripId: z.string().optional().nullable(),
  type: z.nativeEnum(ExpenseType),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().trim().max(240).optional(),
  spentAt: z.coerce.date().optional(),
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
