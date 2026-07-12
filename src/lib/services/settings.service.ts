import { prisma } from "@/lib/db";
import type { RoleKey } from "@prisma/client";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { hashPassword } from "@/lib/auth/password";
import { recordAudit } from "./audit";

const userSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  lockedUntil: true,
  createdAt: true,
  role: { select: { key: true, name: true } },
} as const;

/** Roles with how many users hold each — powers the read-only RBAC reference. */
export function listRoles() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
}

export function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: userSelect });
}

/** Fleet Manager creates a user account and assigns them a role. */
export async function createUser(
  input: { name: string; email: string; password: string; role: RoleKey },
  actorId?: string | null,
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict("An account with that email already exists.");

  const role = await prisma.role.findUnique({ where: { key: input.role } });
  if (!role) throw badRequest("Unknown role");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      roleId: role.id,
    },
    select: userSelect,
  });

  await recordAudit(prisma, {
    entity: "User",
    entityId: user.id,
    action: "CREATE",
    summary: `Created user ${user.name} as ${role.name}`,
    actorId,
  });

  return user;
}

/**
 * Reassign a user's role and/or activate/deactivate them.
 * This is the dynamic half of RBAC — the permissions each role holds stay fixed.
 */
export async function updateUser(
  id: string,
  input: { role?: RoleKey; isActive?: boolean; unlock?: boolean },
  actorId?: string | null,
) {
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) throw notFound("User not found");

  const data: Record<string, unknown> = {};
  let summary = "";

  if (input.role && input.role !== user.role.key) {
    const role = await prisma.role.findUnique({ where: { key: input.role } });
    if (!role) throw badRequest("Unknown role");
    data.roleId = role.id;
    summary = `Changed ${user.name}'s role: ${user.role.name} → ${role.name}`;
  }

  if (input.isActive != null && input.isActive !== user.isActive) {
    data.isActive = input.isActive;
    summary = summary || `${input.isActive ? "Activated" : "Deactivated"} ${user.name}`;
  }

  if (input.unlock) {
    data.lockedUntil = null;
    data.failedAttempts = 0;
    summary = summary || `Unlocked ${user.name}'s account`;
  }

  if (Object.keys(data).length === 0) throw badRequest("Nothing to update");

  const updated = await prisma.user.update({ where: { id }, data, select: userSelect });

  await recordAudit(prisma, {
    entity: "User",
    entityId: id,
    action: "UPDATE",
    summary,
    actorId,
  });

  return updated;
}
