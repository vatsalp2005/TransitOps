import { withAuth, readJson } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getDriver, updateDriver } from "@/lib/services/driver.service";
import { driverUpdateSchema } from "@/lib/validation/driver";

export const GET = withAuth<{ id: string }>(
  async (_req, { params }) => ok(await getDriver(params.id)),
  { module: "drivers", level: "view" },
);

export const PATCH = withAuth<{ id: string }>(
  async (req, { params, auth }) => {
    const input = driverUpdateSchema.parse(await readJson(req));
    return ok(await updateDriver(params.id, input, auth.userId));
  },
  { module: "drivers", level: "edit" },
);
