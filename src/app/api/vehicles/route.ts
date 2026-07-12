import { withAuth, readJson, asEnum } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { VehicleStatus, VehicleType, Region } from "@prisma/client";
import { listVehicles, createVehicle } from "@/lib/services/vehicle.service";
import { vehicleCreateSchema } from "@/lib/validation/vehicle";

export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const data = await listVehicles({
      type: asEnum(VehicleType, searchParams.get("type")),
      status: asEnum(VehicleStatus, searchParams.get("status")),
      region: asEnum(Region, searchParams.get("region")),
      search: searchParams.get("search") ?? undefined,
    });
    return ok(data);
  },
  { module: "vehicles", level: "view" },
);

export const POST = withAuth(
  async (req, { auth }) => {
    const input = vehicleCreateSchema.parse(await readJson(req));
    const vehicle = await createVehicle(input, auth.userId);
    return ok(vehicle, { status: 201 });
  },
  { module: "vehicles", level: "edit" },
);
