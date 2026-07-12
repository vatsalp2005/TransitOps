import { withAuth, readJson } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getVehicle, updateVehicle, retireVehicle } from "@/lib/services/vehicle.service";
import { vehicleUpdateSchema } from "@/lib/validation/vehicle";

export const GET = withAuth<{ id: string }>(
  async (_req, { params }) => ok(await getVehicle(params.id)),
  { module: "vehicles", level: "view" },
);

export const PATCH = withAuth<{ id: string }>(
  async (req, { params, auth }) => {
    const input = vehicleUpdateSchema.parse(await readJson(req));
    return ok(await updateVehicle(params.id, input, auth.userId));
  },
  { module: "vehicles", level: "edit" },
);

// Retire (soft delete) — keeps history, removes from operations.
export const DELETE = withAuth<{ id: string }>(
  async (_req, { params, auth }) => ok(await retireVehicle(params.id, auth.userId)),
  { module: "vehicles", level: "edit" },
);
