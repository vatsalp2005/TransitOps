import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { expiringLicenses, EXPIRY_WINDOW_DAYS } from "@/lib/services/driver.service";

// Drivers whose licence has expired or expires within the window (default 30 days).
export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days")) || EXPIRY_WINDOW_DAYS;
    return ok(await expiringLicenses(days));
  },
  { module: "drivers", level: "view" },
);
