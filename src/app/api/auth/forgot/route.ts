import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api/response";
import { forgotSchema } from "@/lib/validation/auth";
import { requestPasswordReset } from "@/lib/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const { email } = forgotSchema.parse(await req.json().catch(() => ({})));

    // Build the reset link against whatever host the app is served from.
    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    await requestPasswordReset(email, origin);

    // Always the same response — never reveal whether the account exists.
    return ok({ sent: true });
  } catch (err) {
    return handleError(err);
  }
}
