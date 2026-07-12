import { ok, handleError } from "@/lib/api/response";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
