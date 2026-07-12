import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api/response";
import { resetSchema } from "@/lib/validation/auth";
import { resetPassword } from "@/lib/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = resetSchema.parse(await req.json().catch(() => ({})));
    await resetPassword(token, password);
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
