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
