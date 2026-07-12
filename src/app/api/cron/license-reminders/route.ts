import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api/response";
import { forbidden } from "@/lib/api/errors";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/rbac";
import { sendLicenceReminders } from "@/lib/services/reminder.service";
import { EXPIRY_WINDOW_DAYS } from "@/lib/services/driver.service";

/**
 * Licence-expiry reminders.
 *
 * Runs two ways:
 *  1. Vercel Cron (scheduled in vercel.json) — authenticated with CRON_SECRET.
 *  2. Manually by a Safety Officer / Fleet Manager from the dashboard.
 *
 * If CRON_SECRET is unset we refuse unauthenticated calls outright, so the endpoint
 * can never be left open to the internet by accident.
 */
async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const bearer = req.headers.get("authorization");
  const isCron = !!secret && bearer === `Bearer ${secret}`;

  if (!isCron) {
    const auth = await getCurrentUser();
    if (!auth || !can(auth.permissions, "drivers", "edit")) {
      throw forbidden("Only a Safety Officer can send licence reminders.");
    }
  }

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days")) || EXPIRY_WINDOW_DAYS;

  return ok(await sendLicenceReminders(days));
}

export async function GET(req: NextRequest) {
  try {
    return await run(req);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await run(req);
  } catch (err) {
    return handleError(err);
  }
}
