import { withAuth, readJson } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { listFuelLogs, createFuelLog } from "@/lib/services/fuel.service";
import { fuelCreateSchema } from "@/lib/validation/fuel";

export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    return ok(await listFuelLogs(searchParams.get("vehicleId") ?? undefined));
  },
  { module: "fuel", level: "view" },
);

export const POST = withAuth(
  async (req, { auth }) => {
    const input = fuelCreateSchema.parse(await readJson(req));
    const log = await createFuelLog(input, auth.userId);
    return ok(log, { status: 201 });
  },
  { module: "fuel", level: "edit" },
);
