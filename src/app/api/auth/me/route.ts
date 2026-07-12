import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";

export const GET = withAuth(async (_req, { auth }) =>
  ok({
    user: { id: auth.userId, name: auth.name, email: auth.email, role: auth.role },
    permissions: auth.permissions,
  }),
);
