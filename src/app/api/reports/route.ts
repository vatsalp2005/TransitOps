import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getReports } from "@/lib/services/report.service";

export const GET = withAuth(async () => ok(await getReports()), {
  module: "reports",
  level: "view",
});
