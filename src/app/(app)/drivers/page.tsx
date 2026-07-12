"use client";
import { useMemo, useState } from "react";
import { Plus, Users, Search, Pencil, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, THead, TBody, Th, Td, TRow } from "@/components/ui/Table";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { useApi } from "@/lib/client/api";
import { usePermissions } from "@/components/layout/PermissionsProvider";
import { DRIVER_STATUS_META, effectiveDriverStatus } from "@/lib/display";
import { formatDate, daysUntilDate } from "@/lib/format";
import type { Driver } from "@/lib/types";
import { DriverFormModal } from "./DriverFormModal";

export default function DriversPage() {
  const { can } = usePermissions();
  const canEdit = can("drivers", "edit");

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (search) p.set("search", search);
    const q = p.toString();
    return `/api/drivers${q ? `?${q}` : ""}`;
  }, [status, search]);

  const { data, loading, error, refresh } = useApi<Driver[]>(url);

  const openEdit = (d: Driver) => {
    setEditing(d);
    setOpen(true);
  };

  return (
    <div>
      <PageHeader title="Drivers & Safety Profiles" subtitle="Licences, categories, safety scores and duty status.">
        {canEdit && (
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Driver
          </Button>
        )}
      </PageHeader>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line-soft p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or licence…" className="pl-9" />
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: "", label: "All statuses" }, ...Object.entries(DRIVER_STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))]}
            className="w-40"
          />
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading && !data ? (
          <TableSkeleton rows={6} cols={6} />
        ) : data && data.length > 0 ? (
          <Table>
            <THead>
              <tr>
                <Th>Driver</Th>
                <Th>Licence</Th>
                <Th>Category</Th>
                <Th>Expiry</Th>
                <Th className="text-right">Safety</Th>
                <Th>Status</Th>
                {canEdit && <Th className="text-right">Edit</Th>}
              </tr>
            </THead>
            <TBody>
              {data.map((d) => {
                const days = daysUntilDate(d.licenseExpiry);
                const expired = days < 0;
                const soon = days >= 0 && days <= 30;
                return (
                  <TRow key={d.id}>
                    <Td className="font-medium text-fg">{d.name}</Td>
                    <Td className="font-mono text-xs text-muted">{d.licenseNo}</Td>
                    <Td>{d.licenseCategory}</Td>
                    <Td>
                      <span className={expired ? "text-danger" : soon ? "text-inshop" : "text-muted"}>
                        {formatDate(d.licenseExpiry)}
                      </span>
                      {(expired || soon) && (
                        <span className={`ml-1.5 inline-flex items-center gap-0.5 text-[10px] ${expired ? "text-danger" : "text-inshop"}`}>
                          <TriangleAlert className="size-3" />
                          {expired ? "Expired" : `${days}d`}
                        </span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <SafetyPill score={d.safetyScore} />
                    </Td>
                    <Td>
                      <StatusBadge {...effectiveDriverStatus(d.status, expired)} />
                      {d.status === "SUSPENDED" && d.suspensionReason && (
                        <p
                          className="mt-1 max-w-[220px] truncate text-[11px] text-danger"
                          title={d.suspensionReason}
                        >
                          {d.suspensionReason}
                        </p>
                      )}
                    </Td>
                    {canEdit && (
                      <Td className="text-right">
                        <button onClick={() => openEdit(d)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-fg" title="Edit">
                          <Pencil className="size-4" />
                        </button>
                      </Td>
                    )}
                  </TRow>
                );
              })}
            </TBody>
          </Table>
        ) : (
          <EmptyState title="No drivers found" message="Add your first driver profile." icon={<Users className="size-6" />} />
        )}
      </Card>

      {canEdit && <DriverFormModal open={open} onClose={() => setOpen(false)} onSaved={refresh} driver={editing} />}
    </div>
  );
}

function SafetyPill({ score }: { score: number }) {
  const tone = score >= 80 ? "text-available" : score >= 60 ? "text-inshop" : "text-danger";
  return <span className={`font-semibold tabular-nums ${tone}`}>{score}</span>;
}
