import { withAuth } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { listRoles } from "@/lib/services/settings.service";
import { ROLE_PERMISSIONS } from "@/lib/auth/rbac";

/**
 * Read-only RBAC reference: which role holds which permissions, and how many users
 * hold each role. The matrix itself is hardcoded server-side and is NOT editable at
 * runtime (see lib/auth/rbac.ts for why).
 */
export const GET = withAuth(
  async () => {
    const roles = await listRoles();
    return ok(
      roles.map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        description: r.description,
        userCount: r._count.users,
        permissions: ROLE_PERMISSIONS[r.key],
      })),
    );
  },
  { module: "settings", level: "view" },
);
