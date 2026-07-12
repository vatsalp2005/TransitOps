import { withAuth, asEnum } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { VehicleType } from "@prisma/client";
import { getDashboard } from "@/lib/services/dashboard.service";

export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    return ok(await getDashboard({ type: asEnum(VehicleType, searchParams.get("type")) }));
  },
  { module: "dashboard", level: "view" },
);
