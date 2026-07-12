import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { closeMaintenance } from "@/lib/services/maintenance.service";

export const POST = withAuth<{ id: string }>(
  async (_req, { params, auth }) => ok(await closeMaintenance(params.id, auth.userId)),
  { module: "maintenance", level: "edit" },
);
