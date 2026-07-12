/** Relative time like "3m ago", "2h ago", "5d ago". */
export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Format an ISO date as "12 Jul 2026". */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Whole calendar days until a date; negative when past, 0 when it is today.
 *
 * licenceExpiry is a date-only value (stored `@db.Date`, serialized as UTC
 * midnight). We compare it against today as calendar dates — both reduced to a
 * UTC-midnight timestamp — so the answer is an exact number of days regardless of
 * the viewer's timezone. The previous version mixed a UTC-midnight expiry with a
 * *local* midnight "today", which rounded a 1-day gap up to 2 in positive-offset
 * zones like IST.
 */
export function daysUntilDate(date: string | Date): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const expiry = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiry - today) / 86_400_000);
}
