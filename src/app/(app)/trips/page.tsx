"use client";
import { useMemo, useState } from "react";
import { Plus, Route, Search, Send, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, THead, TBody, Th, Td, TRow } from "@/components/ui/Table";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApi, apiFetch, ApiError } from "@/lib/client/api";
import { usePermissions } from "@/components/layout/PermissionsProvider";
import { TRIP_STATUS_META } from "@/lib/display";
import { formatNumber } from "@/lib/utils";
import type { Trip } from "@/lib/types";
import { TripFormModal } from "./TripFormModal";

export default function TripsPage() {
  const { can } = usePermissions();
  const { toast } = useToast();
  const canEdit = can("trips", "edit");

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [completing, setCompleting] = useState<Trip | null>(null);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (search) p.set("search", search);
    const q = p.toString();
    return `/api/trips${q ? `?${q}` : ""}`;
  }, [status, search]);

  const { data, loading, error, refresh } = useApi<Trip[]>(url, { refreshInterval: 15000 });

  const action = async (t: Trip, verb: "dispatch" | "cancel") => {
    if (verb === "cancel" && !confirm(`Cancel ${t.code}?`)) return;
    try {
      await apiFetch(`/api/trips/${t.id}/${verb}`, { method: "POST" });
      toast(`${t.code} ${verb === "dispatch" ? "dispatched" : "cancelled"}`);
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Action failed", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Trip Dispatcher" subtitle="Create, dispatch and complete trips — rules enforced automatically.">
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New Trip
          </Button>
        )}
      </PageHeader>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line-soft p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, source or destination…" className="pl-9" />
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: "", label: "All statuses" }, ...Object.entries(TRIP_STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))]}
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
                <Th>Trip</Th>
                <Th>Route</Th>
                <Th>Vehicle</Th>
                <Th>Driver</Th>
                <Th className="text-right">Cargo</Th>
                <Th>Status</Th>
                {canEdit && <Th className="text-right">Actions</Th>}
              </tr>
            </THead>
            <TBody>
              {data.map((t) => (
                <TRow key={t.id}>
                  <Td className="font-mono text-xs font-medium text-fg">{t.code}</Td>
                  <Td>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="text-fg">{t.source}</span>
                      <ArrowRight className="size-3 text-faint" />
                      <span className="text-fg">{t.destination}</span>
                    </span>
                    <span className="text-xs text-faint">{formatNumber(t.plannedDistance)} km planned</span>
                  </Td>
                  <Td className="text-muted">{t.vehicle.registrationNo}</Td>
                  <Td className="text-muted">{t.driver.name}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(t.cargoWeightKg)} kg</Td>
                  <Td>
                    <StatusBadge tone={TRIP_STATUS_META[t.status].tone} label={TRIP_STATUS_META[t.status].label} />
                  </Td>
                  {canEdit && (
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        {t.status === "DRAFT" && (
                          <Button size="sm" variant="secondary" onClick={() => action(t, "dispatch")}>
                            <Send className="size-3.5" /> Dispatch
                          </Button>
                        )}
                        {t.status === "DISPATCHED" && (
                          <Button size="sm" variant="secondary" onClick={() => setCompleting(t)}>
                            <CheckCircle2 className="size-3.5" /> Complete
                          </Button>
                        )}
                        {(t.status === "DRAFT" || t.status === "DISPATCHED") && (
                          <button onClick={() => action(t, "cancel")} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger" title="Cancel">
                            <XCircle className="size-4" />
                          </button>
                        )}
                        {(t.status === "COMPLETED" || t.status === "CANCELLED") && <span className="text-xs text-faint">—</span>}
                      </div>
                    </Td>
                  )}
                </TRow>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState title="No trips yet" message="Dispatch your first trip to get moving." icon={<Route className="size-6" />} />
        )}
      </Card>

      {canEdit && <TripFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={refresh} />}
      {canEdit && <CompleteTripModal trip={completing} onClose={() => setCompleting(null)} onSaved={refresh} />}
    </div>
  );
}

function CompleteTripModal({ trip, onClose, onSaved }: { trip: Trip | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ endOdometer: "", fuelConsumedL: "", revenue: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;
    setSaving(true);
    try {
      await apiFetch(`/api/trips/${trip.id}/complete`, {
        method: "POST",
        body: {
          endOdometer: Number(form.endOdometer),
          fuelConsumedL: Number(form.fuelConsumedL),
          ...(form.revenue ? { revenue: Number(form.revenue) } : {}),
        },
      });
      toast(`${trip.code} completed — vehicle & driver freed`);
      setForm({ endOdometer: "", fuelConsumedL: "", revenue: "" });
      onSaved();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to complete", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!trip} onClose={onClose} title={`Complete ${trip?.code ?? ""}`} description="Record final odometer and fuel. Vehicle & driver return to Available.">
      <form onSubmit={submit} className="space-y-3">
        <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-sm text-muted">
          {trip?.source} → {trip?.destination} · start odometer{" "}
          <span className="text-fg">{trip?.startOdometer != null ? formatNumber(trip.startOdometer) : "—"} km</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Final Odometer (km)">
            <Input type="number" value={form.endOdometer} onChange={(e) => setForm((f) => ({ ...f, endOdometer: e.target.value }))} required />
          </Field>
          <Field label="Fuel Consumed (L)">
            <Input type="number" step="0.1" value={form.fuelConsumedL} onChange={(e) => setForm((f) => ({ ...f, fuelConsumedL: e.target.value }))} required />
          </Field>
        </div>
        <Field label="Revenue (₹)" hint="Leave blank to keep the planned revenue.">
          <Input type="number" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Complete trip</Button>
        </div>
      </form>
    </Modal>
  );
}
