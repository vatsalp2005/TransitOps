import { prisma } from "@/lib/db";
import { randomBytes, createHash } from "node:crypto";
import type { RoleKey } from "@prisma/client";
import { badRequest, conflict, unauthorized, notFound } from "@/lib/api/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sendMail, resetEmail } from "@/lib/mailer";
import { recordAudit } from "./audit";

/** Brute-force policy. */
export const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const RESET_TTL_MINUTES = 60;

/** Store only a hash of the reset token, never the raw value. */
const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

/**
 * Verify credentials with brute-force protection.
 * After 5 consecutive failures the account locks for 15 minutes.
 */
export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

  // Generic message everywhere so we never leak which emails exist.
  const invalid = unauthorized("Invalid email or password");
  if (!user || !user.isActive) throw invalid;

  // Locked?
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw unauthorized(
      `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}, or reset your password.`,
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    const attempts = user.failedAttempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });

    if (lock) {
      await recordAudit(prisma, {
        entity: "User",
        entityId: user.id,
        action: "UPDATE",
        summary: `Account locked for ${user.email} after ${MAX_FAILED_ATTEMPTS} failed logins`,
      });
      throw unauthorized(
        `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCK_MINUTES} minutes, or reset your password.`,
      );
    }

    const left = MAX_FAILED_ATTEMPTS - attempts;
    throw unauthorized(`Invalid email or password. ${left} attempt${left === 1 ? "" : "s"} left before the account is locked.`);
  }

  // Success — clear the counter.
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  return user;
}

/** Self-service registration. The chosen role decides what they can do. */
export async function signup(input: {
  name: string;
  email: string;
  password: string;
  role: RoleKey;
}) {
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
    include: { role: true },
  });

  await recordAudit(prisma, {
    entity: "User",
    entityId: user.id,
    action: "CREATE",
    summary: `${user.name} registered as ${role.name}`,
    actorId: user.id,
  });

  return user;
}

/**
 * Begin a password reset. Always resolves successfully (even for unknown emails)
 * so the endpoint can't be used to enumerate accounts.
 */
export async function requestPasswordReset(email: string, origin: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return { sent: true };

  const raw = randomBytes(32).toString("base64url");

  await prisma.passwordResetToken.create({
    data: {
      token: hashToken(raw),
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
    },
  });

  const link = `${origin}/reset-password?token=${raw}`;
  const { text, html } = resetEmail(user.name, link);
  await sendMail({ to: user.email, subject: "Reset your TransitOps password", text, html });

  return { sent: true };
}

/** Complete a reset: single-use, expiring token. Also clears any lockout. */
export async function resetPassword(rawToken: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashToken(rawToken) },
    include: { user: true },
  });

  if (!record || record.usedAt) throw badRequest("This reset link is invalid or has already been used.");
  if (record.expiresAt < new Date()) throw badRequest("This reset link has expired. Request a new one.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: await hashPassword(newPassword),
        failedAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await recordAudit(prisma, {
    entity: "User",
    entityId: record.userId,
    action: "UPDATE",
    summary: `Password reset for ${record.user.email}`,
  });

  return { ok: true };
}
