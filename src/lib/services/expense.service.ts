import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { recordAudit } from "./audit";
import type { ExpenseCreateInput } from "@/lib/validation/expense";

const include = {
  vehicle: { select: { id: true, registrationNo: true, name: true } },
  trip: { select: { id: true, code: true } },
} satisfies Prisma.ExpenseInclude;

export function listExpenses(vehicleId?: string) {
  return prisma.expense.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include,
    orderBy: { spentAt: "desc" },
  });
}

export async function createExpense(input: ExpenseCreateInput, actorId?: string | null) {
  const expense = await prisma.expense.create({
    data: {
      vehicleId: input.vehicleId,
      tripId: input.tripId ?? null,
      type: input.type,
      amount: input.amount,
      note: input.note,
      spentAt: input.spentAt ?? new Date(),
    },
    include,
  });
  await recordAudit(prisma, {
    entity: "Expense",
    entityId: expense.id,
    action: "CREATE",
    summary: `Recorded ${input.type.toLowerCase()} expense for ${expense.vehicle.registrationNo}`,
    actorId,
  });
  return expense;
}
