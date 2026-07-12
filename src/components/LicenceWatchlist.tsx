"use client";
import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Send, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, ApiError } from "@/lib/client/api";
import { usePermissions } from "@/components/layout/PermissionsProvider";
import { formatDate, daysUntilDate } from "@/lib/format";
import type { ExpiringLicence } from "@/lib/types";

type Result = { expiring: number; driversNotified: number; digestSent: boolean };

/**
 * Compliance watchlist: drivers whose licence has expired or expires within 30 days.
 * Expired drivers are already blocked from dispatch by the trip rules — this surfaces
 * them *before* they become a problem.
 */
export function LicenceWatchlist({ drivers }: { drivers: ExpiringLicence[] }) {
  const { can } = usePermissions();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const canSend = can("drivers", "edit");

  const send = async () => {
    setSending(true);
    try {
      const r = await apiFetch<Result>("/api/cron/license-reminders", { method: "POST" });
      toast(
        r.expiring === 0
          ? "No licences expiring — nothing to send."
          : `Reminders sent: ${r.driversNotified} driver(s) emailed${r.digestSent ? ", compliance team notified" : ""}.`,
      );
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not send reminders", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Licence Watchlist"
        subtitle={drivers.length ? `${drivers.length} expiring within 30 days` : "All licences valid"}
        icon={<ShieldAlert className="size-3.5" />}
        action={
          canSend && drivers.length > 0 ? (
            <Button size="sm" variant="secondary" loading={sending} onClick={send}>
              <Send className="size-3.5" /> Remind
            </Button>
          ) : undefined
        }
      />

      {drivers.length === 0 ? (
        <EmptyState
          title="No licences expiring"
          message="Every driver's licence is valid for the next 30 days."
          icon={<CheckCircle2 className="size-6" />}
        />
      ) : (
        <div className="divide-y divide-line">
          {drivers.slice(0, 6).map((d) => {
            const left = daysUntilDate(d.licenseExpiry);
            const expired = left < 0;
            const urgent = !expired && left <= 7;
            return (
              <Link
                key={d.id}
                href="/drivers"
                className="flex items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-panel-2/70"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{d.name}</p>
                  <p className="numeric text-[11px] text-muted">{d.licenseNo}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`numeric text-xs font-medium ${
                      expired ? "text-danger" : urgent ? "text-inshop" : "text-muted"
                    }`}
                  >
                    {expired ? "EXPIRED" : `${left}d left`}
                  </p>
                  <p className="label-tech">{formatDate(d.licenseExpiry)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
