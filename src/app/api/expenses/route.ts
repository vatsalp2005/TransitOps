import { withAuth, readJson } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { listExpenses, createExpense } from "@/lib/services/expense.service";
import { expenseCreateSchema } from "@/lib/validation/expense";

export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    return ok(await listExpenses(searchParams.get("vehicleId") ?? undefined));
  },
  { module: "fuel", level: "view" },
);

export const POST = withAuth(
  async (req, { auth }) => {
    const input = expenseCreateSchema.parse(await readJson(req));
    const expense = await createExpense(input, auth.userId);
    return ok(expense, { status: 201 });
  },
  { module: "fuel", level: "edit" },
);
