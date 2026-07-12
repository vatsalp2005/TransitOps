import { withAuth, readJson } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { listUsers, createUser } from "@/lib/services/settings.service";
import { userCreateSchema } from "@/lib/validation/settings";

export const GET = withAuth(async () => ok(await listUsers()), {
  module: "settings",
  level: "view",
});

// Fleet Manager creates an account and assigns its role.
export const POST = withAuth(
  async (req, { auth }) => {
    const input = userCreateSchema.parse(await readJson(req));
    return ok(await createUser(input, auth.userId), { status: 201 });
  },
  { module: "settings", level: "edit" },
);
