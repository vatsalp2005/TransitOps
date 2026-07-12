import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { assignableDrivers } from "@/lib/services/driver.service";

// Drivers eligible for dispatch (AVAILABLE, not suspended, license valid).
export const GET = withAuth(async () => ok(await assignableDrivers()), {
  module: "trips",
  level: "view",
});
