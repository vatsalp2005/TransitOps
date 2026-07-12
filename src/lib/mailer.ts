import "server-only";
import nodemailer from "nodemailer";

/**
 * SMTP transport. Configured via env so no credentials are ever committed:
 *   SMTP_HOST (default smtp.gmail.com)
 *   SMTP_PORT (default 587)
 *   SMTP_USER  e.g. kevalgajjarm@gmail.com
 *   SMTP_PASS  a Gmail **App Password** (not the account password)
 *
 * If SMTP is not configured we degrade gracefully: the email is logged instead of
 * sent, so local dev and the demo never crash on a missing credential.
 */
function getTransport() {
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // STARTTLS on 587
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }) {
  const transport = getTransport();
  if (!transport) {
    console.warn(`[mailer] SMTP not configured — would have emailed ${opts.to}: ${opts.subject}`);
    console.warn(`[mailer] ${opts.text}`);
    return { delivered: false as const };
  }

  await transport.sendMail({
    from: `"TransitOps" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return { delivered: true as const };
}

const shell = (title: string, body: string) => `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;background:#0a0b0d;padding:32px;color:#e8ebf0">
    <div style="max-width:560px;margin:0 auto;background:#101216;border:1px solid #22262e;border-radius:4px;padding:28px">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#ff5a1f">TransitOps</p>
      <h1 style="margin:0 0 16px;font-size:19px;color:#fff">${title}</h1>
      ${body}
    </div>
  </div>`;

const fmt = (d: Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** Reminder sent directly to a driver whose licence is expiring (or has expired). */
export function licenceReminderEmail(
  name: string,
  licenceNo: string,
  expiry: Date,
  daysLeft: number,
) {
  const expired = daysLeft < 0;
  const subject = expired
    ? `Action required: your driving licence has expired`
    : `Your driving licence expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

  const headline = expired
    ? `Your licence <strong>${licenceNo}</strong> expired on <strong>${fmt(expiry)}</strong>.`
    : `Your licence <strong>${licenceNo}</strong> expires on <strong>${fmt(expiry)}</strong> — that is <strong>${daysLeft} day${daysLeft === 1 ? "" : "s"}</strong> away.`;

  const text = `Hi ${name},

${expired ? `Your driving licence ${licenceNo} expired on ${fmt(expiry)}.` : `Your driving licence ${licenceNo} expires on ${fmt(expiry)} (${daysLeft} days away).`}

Until it is renewed you cannot be assigned to trips. Please renew it and send the updated details to your safety officer.

— TransitOps`;

  const html = shell(
    expired ? "Your licence has expired" : "Your licence is expiring",
    `<p style="margin:0 0 14px;line-height:1.6;color:#8b93a1">Hi ${name}, ${headline}</p>
     <p style="margin:0;padding:12px;border-left:2px solid ${expired ? "#f43f5e" : "#fbbf24"};background:#15181d;line-height:1.6;color:#8b93a1">
       Until it is renewed you <strong style="color:#fff">cannot be assigned to trips</strong>.
       Please renew it and send the updated details to your safety officer.
     </p>`,
  );

  return { subject, text, html };
}

/** Digest to Safety Officers + Fleet Managers listing every expiring licence. */
export function complianceDigestEmail(
  rows: { name: string; licenseNo: string; expiry: Date; daysLeft: number }[],
  windowDays: number,
) {
  const subject = `${rows.length} driving licence${rows.length === 1 ? "" : "s"} expiring within ${windowDays} days`;

  const text = [
    `Licences expiring within ${windowDays} days:`,
    "",
    ...rows.map(
      (r) =>
        `- ${r.name} (${r.licenseNo}) — ${r.daysLeft < 0 ? `EXPIRED ${fmt(r.expiry)}` : `${r.daysLeft} days left, ${fmt(r.expiry)}`}`,
    ),
    "",
    "Drivers with expired licences are automatically blocked from dispatch.",
  ].join("\n");

  const list = rows
    .map((r) => {
      const tone = r.daysLeft < 0 ? "#f43f5e" : r.daysLeft <= 7 ? "#fbbf24" : "#8b93a1";
      const label = r.daysLeft < 0 ? `Expired ${fmt(r.expiry)}` : `${r.daysLeft} days · ${fmt(r.expiry)}`;
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #22262e;color:#fff">${r.name}
          <span style="color:#5d6472;font-size:12px"> ${r.licenseNo}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #22262e;text-align:right;color:${tone};font-size:13px">${label}</td>
      </tr>`;
    })
    .join("");

  const html = shell(
    `${rows.length} licence${rows.length === 1 ? "" : "s"} expiring`,
    `<table style="width:100%;border-collapse:collapse">${list}</table>
     <p style="margin:18px 0 0;font-size:12px;color:#5d6472;line-height:1.6">
       Drivers with expired licences are automatically blocked from dispatch.
     </p>`,
  );

  return { subject, text, html };
}

/** Branded password-reset email. */
export function resetEmail(name: string, link: string) {
  const text = `Hi ${name},

We received a request to reset your TransitOps password.
Open this link to choose a new one (valid for 60 minutes):

${link}

If you didn't request this, you can safely ignore this email.

— TransitOps`;

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;background:#0b0c0f;padding:32px;color:#e7e9ee">
    <div style="max-width:520px;margin:0 auto;background:#13151b;border:1px solid #262a35;border-radius:12px;padding:28px">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#f5a524">TransitOps</p>
      <h1 style="margin:0 0 16px;font-size:20px;color:#fff">Reset your password</h1>
      <p style="margin:0 0 20px;line-height:1.6;color:#9aa3b2">
        Hi ${name}, we received a request to reset your password. This link is valid for 60 minutes.
      </p>
      <a href="${link}" style="display:inline-block;background:#f5a524;color:#000;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:8px">
        Choose a new password
      </a>
      <p style="margin:22px 0 0;font-size:12px;color:#6b7280;line-height:1.6">
        If you didn't request this, you can safely ignore this email.<br/>
        Trouble with the button? Paste this into your browser:<br/>
        <span style="color:#9aa3b2;word-break:break-all">${link}</span>
      </p>
    </div>
  </div>`;

  return { text, html };
}
