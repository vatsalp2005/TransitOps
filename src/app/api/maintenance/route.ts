import { withAuth, readJson, asEnum } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { MaintenanceStatus } from "@prisma/client";
import { listMaintenance, openMaintenance } from "@/lib/services/maintenance.service";
import { maintenanceCreateSchema } from "@/lib/validation/maintenance";

export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    return ok(
      await listMaintenance({ status: asEnum(MaintenanceStatus, searchParams.get("status")) }),
    );
  },
  { module: "maintenance", level: "view" },
);

export const POST = withAuth(
  async (req, { auth }) => {
    const input = maintenanceCreateSchema.parse(await readJson(req));
    const log = await openMaintenance(input, auth.userId);
    return ok(log, { status: 201 });
  },
  { module: "maintenance", level: "edit" },
);
