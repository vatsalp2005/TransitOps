import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api/response";
import { loginSchema } from "@/lib/validation/auth";
import { authenticate } from "@/lib/services/auth.service";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = loginSchema.parse(body);
    const user = await authenticate(input.email, input.password);

    await createSession(
      { userId: user.id, email: user.email, name: user.name, role: user.role.key },
      input.rememberMe,
    );

    return ok({ id: user.id, name: user.name, email: user.email, role: user.role.key });
  } catch (err) {
    return handleError(err);
  }
}
