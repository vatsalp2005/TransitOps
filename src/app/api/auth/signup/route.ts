import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api/response";
import { signupSchema } from "@/lib/validation/auth";
import { signup } from "@/lib/services/auth.service";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const input = signupSchema.parse(await req.json().catch(() => ({})));
    const user = await signup(input);

    // Sign the new user straight in.
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role.key,
    });

    return ok({ id: user.id, name: user.name, email: user.email, role: user.role.key }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
