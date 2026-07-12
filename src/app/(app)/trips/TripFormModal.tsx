"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useApi, apiFetch, ApiError } from "@/lib/client/api";
import type { Vehicle, Driver, Trip } from "@/lib/types";

const emptyForm = {
  source: "",
  destination: "",
  vehicleId: "",
  driverId: "",
  cargoWeightKg: "",
  plannedDistance: "",
  revenue: "",
};

export function TripFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const { data: vehicles } = useApi<Vehicle[]>(open ? "/api/vehicles/selectable" : null);
  const { data: drivers } = useApi<Driver[]>(open ? "/api/drivers/assignable" : null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dispatchNow, setDispatchNow] = useState(true);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setErrors({});
    }
  }, [open]);

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectedVehicle = useMemo(
    () => vehicles?.find((v) => v.id === form.vehicleId),
    [vehicles, form.vehicleId],
  );
  const cargo = Number(form.cargoWeightKg) || 0;
  const capacity = selectedVehicle?.maxLoadKg ?? 0;
  const overloaded = selectedVehicle && cargo > capacity;
  const loadPct = capacity ? Math.min(100, (cargo / capacity) * 100) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (overloaded) return;
    setSaving(true);
    setErrors({});
    try {
      const trip = await apiFetch<Trip>("/api/trips", {
        method: "POST",
        body: {
          source: form.source,
          destination: form.destination,
          vehicleId: form.vehicleId,
          driverId: form.driverId,
          cargoWeightKg: cargo,
          plannedDistance: Number(form.plannedDistance),
          revenue: Number(form.revenue) || 0,
        },
      });
      if (dispatchNow) {
        await apiFetch(`/api/trips/${trip.id}/dispatch`, { method: "POST" });
        toast(`${trip.code} created & dispatched`);
      } else {
        toast(`${trip.code} saved as draft`);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      toast(err instanceof ApiError ? err.message : "Failed to create trip", "error");
    } finally {
      setSaving(false);
    }
  };

  const noVehicles = vehicles?.length === 0;
  const noDrivers = drivers?.length === 0;
  const blocked = noVehicles || noDrivers;

  return (
    <Modal open={open} onClose={onClose} title="Dispatch New Trip" description="Only available vehicles and eligible drivers are shown." size="lg">
      {/* Explain an empty dispatch pool instead of showing a silently-empty dropdown. */}
      {blocked && (
        <div className="mb-4 rounded-[3px] border border-inshop/40 bg-inshop/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-inshop">
            <AlertTriangle className="size-3.5" />
            {noVehicles && noDrivers
              ? "No vehicles or drivers are available to dispatch."
              : noVehicles
                ? "No vehicles are available to dispatch."
                : "No drivers are eligible to dispatch."}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {noVehicles && "Vehicles are excluded when they are On Trip, In Shop or Retired. "}
            {noDrivers &&
              "Drivers are excluded when they are already On Trip, Off Duty, Suspended, or their licence has expired. "}
            Complete an active trip, close a maintenance job, or renew a licence to free one up.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source" error={errors.source}>
            <Input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Mumbai Port" required />
          </Field>
          <Field label="Destination" error={errors.destination}>
            <Input value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Pune Warehouse" required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Vehicle (${vehicles?.length ?? 0} available)`} error={errors.vehicleId}>
            <Select
              value={form.vehicleId}
              onChange={(e) => set("vehicleId", e.target.value)}
              options={(vehicles ?? []).map((v) => ({ value: v.id, label: `${v.registrationNo} · ${v.maxLoadKg}kg` }))}
              placeholder="Select vehicle"
              required
            />
          </Field>
          <Field label={`Driver (${drivers?.length ?? 0} eligible)`} error={errors.driverId}>
            <Select
              value={form.driverId}
              onChange={(e) => set("driverId", e.target.value)}
              options={(drivers ?? []).map((d) => ({ value: d.id, label: `${d.name} · ${d.licenseCategory}` }))}
              placeholder="Select driver"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Cargo (kg)" error={errors.cargoWeightKg}>
            <Input type="number" value={form.cargoWeightKg} onChange={(e) => set("cargoWeightKg", e.target.value)} placeholder="450" required />
          </Field>
          <Field label="Distance (km)" error={errors.plannedDistance}>
            <Input type="number" value={form.plannedDistance} onChange={(e) => set("plannedDistance", e.target.value)} placeholder="165" required />
          </Field>
          <Field label="Revenue (₹)" error={errors.revenue}>
            <Input type="number" value={form.revenue} onChange={(e) => set("revenue", e.target.value)} placeholder="28000" />
          </Field>
        </div>

        {/* Live capacity gauge */}
        {selectedVehicle && (
          <div className={`rounded-lg border p-3 ${overloaded ? "border-danger/40 bg-danger/5" : "border-line bg-white/[0.02]"}`}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted">
                <Gauge className="size-3.5" /> Load vs capacity
              </span>
              <span className={overloaded ? "text-danger" : "text-muted"}>
                {cargo} / {capacity} kg
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div className={`h-full rounded-full transition-all ${overloaded ? "bg-danger" : "bg-available"}`} style={{ width: `${loadPct}%` }} />
            </div>
            <p className={`mt-2 flex items-center gap-1.5 text-xs ${overloaded ? "text-danger" : "text-available"}`}>
              {overloaded ? (
                <>
                  <AlertTriangle className="size-3.5" /> Cargo exceeds capacity by {cargo - capacity} kg — reduce load or pick a bigger vehicle.
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" /> Within capacity.
                </>
              )}
            </p>
          </div>
        )}

        <label className="flex items-center gap-2 pt-1 text-sm text-muted">
          <input type="checkbox" checked={dispatchNow} onChange={(e) => setDispatchNow(e.target.checked)} className="accent-[var(--color-accent)]" />
          Dispatch immediately (vehicle & driver become On Trip)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} disabled={!!overloaded || blocked}>
            {dispatchNow ? "Create & Dispatch" : "Save Draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
