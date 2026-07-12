import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { selectableVehicles } from "@/lib/services/vehicle.service";

// Vehicles eligible for dispatch (AVAILABLE only).
export const GET = withAuth(async () => ok(await selectableVehicles()), {
  module: "trips",
  level: "view",
});
