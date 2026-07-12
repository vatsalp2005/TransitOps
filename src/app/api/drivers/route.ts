import { withAuth, readJson, asEnum } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { DriverStatus } from "@prisma/client";
import { listDrivers, createDriver } from "@/lib/services/driver.service";
import { driverCreateSchema } from "@/lib/validation/driver";

export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const data = await listDrivers({
      status: asEnum(DriverStatus, searchParams.get("status")),
      search: searchParams.get("search") ?? undefined,
    });
    return ok(data);
  },
  { module: "drivers", level: "view" },
);

export const POST = withAuth(
  async (req, { auth }) => {
    const input = driverCreateSchema.parse(await readJson(req));
    const driver = await createDriver(input, auth.userId);
    return ok(driver, { status: 201 });
  },
  { module: "drivers", level: "edit" },
);
