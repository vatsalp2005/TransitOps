import { withAuth, readJson } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { updateUser } from "@/lib/services/settings.service";
import { userUpdateSchema } from "@/lib/validation/settings";

// Reassign a user's role (e.g. Financial Analyst -> Driver), or activate/unlock them.
export const PATCH = withAuth<{ id: string }>(
  async (req, { params, auth }) => {
    const input = userUpdateSchema.parse(await readJson(req));
    return ok(await updateUser(params.id, input, auth.userId));
  },
  { module: "settings", level: "edit" },
);
