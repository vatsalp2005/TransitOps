import { prisma } from "@/lib/db";
import { RoleKey } from "@prisma/client";
import { sendMail, licenceReminderEmail, complianceDigestEmail } from "@/lib/mailer";
import { expiringLicenses, EXPIRY_WINDOW_DAYS } from "./driver.service";
import { recordAudit } from "./audit";

/** Don't email the same driver more often than this. */
const REMINDER_COOLDOWN_DAYS = 7;

const daysLeft = (expiry: Date) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - start.getTime()) / 86_400_000);
};

/**
 * Licence-expiry reminders.
 *
 * Emails each affected driver who has an address on file (respecting a cooldown so a
 * daily cron doesn't spam them), and always sends a single digest to the compliance
 * team (Safety Officers + Fleet Managers) so expiries can't slip silently.
 */
export async function sendLicenceReminders(days = EXPIRY_WINDOW_DAYS) {
  const drivers = await expiringLicenses(days);

  if (drivers.length === 0) {
    return { checked: 0, driversNotified: 0, digestSent: false, expiring: 0 };
  }

  const cooldown = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * 86_400_000);

  // 1. Notify drivers individually (only those with an email + past cooldown).
  let driversNotified = 0;
  for (const d of drivers) {
    if (!d.email) continue;
    if (d.lastReminderAt && d.lastReminderAt > cooldown) continue;

    const remaining = daysLeft(d.licenseExpiry);
    const { subject, text, html } = licenceReminderEmail(d.name, d.licenseNo, d.licenseExpiry, remaining);

    await sendMail({ to: d.email, subject, text, html });
    await prisma.driver.update({
      where: { id: d.id },
      data: { lastReminderAt: new Date() },
    });
    driversNotified++;
  }

  // 2. Digest to the compliance team.
  const team = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { key: { in: [RoleKey.SAFETY_OFFICER, RoleKey.FLEET_MANAGER] } },
    },
    select: { email: true },
  });

  const rows = drivers.map((d) => ({
    name: d.name,
    licenseNo: d.licenseNo,
    expiry: d.licenseExpiry,
    daysLeft: daysLeft(d.licenseExpiry),
  }));

  let digestSent = false;
  if (team.length > 0) {
    const { subject, text, html } = complianceDigestEmail(rows, days);
    await sendMail({ to: team.map((t) => t.email).join(","), subject, text, html });
    digestSent = true;
  }

  await recordAudit(prisma, {
    entity: "Driver",
    entityId: "licence-reminders",
    action: "UPDATE",
    summary: `Licence reminders: ${drivers.length} expiring, ${driversNotified} driver(s) emailed`,
  });

  return {
    checked: drivers.length,
    expiring: drivers.length,
    driversNotified,
    digestSent,
  };
}
