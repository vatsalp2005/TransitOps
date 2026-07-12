import { prisma } from "@/lib/db";
import { AuditAction, Prisma } from "@prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

/** Append an immutable audit entry. Safe to call inside a transaction. */
export function recordAudit(
  db: Db,
  input: {
    entity: string;
    entityId: string;
    action: AuditAction;
    summary: string;
    actorId?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return db.auditLog.create({
    data: {
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      summary: input.summary,
      actorId: input.actorId ?? null,
      metadata: input.metadata,
    },
  });
}

/** Most recent activity across the platform — powers the live activity feed. */
export function recentActivity(limit = 12) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true } } },
  });
}
