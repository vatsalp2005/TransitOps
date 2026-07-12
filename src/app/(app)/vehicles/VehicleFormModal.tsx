"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { VehicleStatus, VehicleType } from "@prisma/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, ApiError } from "@/lib/client/api";
import { VEHICLE_TYPE_LABEL, VEHICLE_STATUS_META, enumOptions } from "@/lib/display";
import { INDIA_STATES } from "@/lib/india-map";
import type { Vehicle } from "@/lib/types";

const VehicleModel = dynamic(
  () => import("@/components/three/VehicleModel").then((m) => m.VehicleModel),
  { ssr: false, loading: () => <div className="size-full skeleton rounded-xl" /> },
);

type FormState = {
  registrationNo: string;
  name: string;
  type: string;
  maxLoadKg: string;
  odometerKm: string;
  acquisitionCost: string;
  region: string;
  status: VehicleStatus;
};

const empty: FormState = {
  registrationNo: "",
  name: "",
  type: "VAN",
  maxLoadKg: "",
  odometerKm: "0",
  acquisitionCost: "",
  region: "MH",
  status: "AVAILABLE",
};

/** States/UTs, alphabetical — drives the region select and the dashboard map. */
const REGION_OPTIONS = INDIA_STATES.map((s) => ({ value: s.code, label: s.name }));

export function VehicleFormModal({
  open,
  onClose,
  onSaved,
  vehicle,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  vehicle: Vehicle | null;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        vehicle
          ? {
              registrationNo: vehicle.registrationNo,
              name: vehicle.name,
              type: vehicle.type,
              maxLoadKg: String(vehicle.maxLoadKg),
              odometerKm: String(vehicle.odometerKm),
              acquisitionCost: String(vehicle.acquisitionCost),
              region: vehicle.region,
              status: vehicle.status,
            }
          : empty,
      );
    }
  }, [open, vehicle]);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        registrationNo: form.registrationNo,
        name: form.name,
        type: form.type,
        maxLoadKg: Number(form.maxLoadKg),
        odometerKm: Number(form.odometerKm),
        acquisitionCost: Number(form.acquisitionCost),
        region: form.region,
        ...(vehicle ? { status: form.status } : {}),
      };
      if (vehicle) {
        await apiFetch(`/api/vehicles/${vehicle.id}`, { method: "PATCH", body: payload });
        toast(`${form.registrationNo} updated`);
      } else {
        await apiFetch("/api/vehicles", { method: "POST", body: payload });
        toast(`${form.registrationNo} registered`);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      toast(err instanceof ApiError ? err.message : "Failed to save vehicle", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vehicle ? "Edit Vehicle" : "Register Vehicle"}
      description="Add a vehicle to the fleet registry."
      size="xl"
    >
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        {/* Live 3D preview */}
        <div className="flex flex-col">
          <div className="relative h-56 rounded-xl border border-line bg-bg/60 md:h-full">
            <VehicleModel status={form.status} type={form.type as VehicleType} />
            <div className="absolute left-3 top-3">
              <StatusBadge
                tone={VEHICLE_STATUS_META[form.status].tone}
                label={VEHICLE_STATUS_META[form.status].label}
              />
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-faint">
              {form.name || "New vehicle"} · {VEHICLE_TYPE_LABEL[form.type as keyof typeof VEHICLE_TYPE_LABEL]}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Registration No." error={errors.registrationNo}>
              <Input value={form.registrationNo} onChange={(e) => set("registrationNo", e.target.value)} placeholder="MH-01-AB-1234" required />
            </Field>
            <Field label="Name / Model" error={errors.name}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Tata Ace" required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" error={errors.type}>
              <Select value={form.type} onChange={(e) => set("type", e.target.value)} options={enumOptions(VEHICLE_TYPE_LABEL)} />
            </Field>
            <Field label="Max Load (kg)" error={errors.maxLoadKg}>
              <Input type="number" value={form.maxLoadKg} onChange={(e) => set("maxLoadKg", e.target.value)} placeholder="750" required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Odometer (km)" error={errors.odometerKm}>
              <Input type="number" value={form.odometerKm} onChange={(e) => set("odometerKm", e.target.value)} />
            </Field>
            <Field label="Acquisition Cost (₹)" error={errors.acquisitionCost}>
              <Input type="number" value={form.acquisitionCost} onChange={(e) => set("acquisitionCost", e.target.value)} placeholder="850000" required />
            </Field>
          </div>
          <Field label="Based in (State)" error={errors.region} hint="Drives the fleet-by-state map.">
            <Select value={form.region} onChange={(e) => set("region", e.target.value)} options={REGION_OPTIONS} />
          </Field>
          {vehicle && (
            <Field label="Status" error={errors.status} hint="On-trip status is controlled by dispatch.">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                options={enumOptions(
                  Object.fromEntries(
                    Object.entries(VEHICLE_STATUS_META).map(([k, v]) => [k, v.label]),
                  ) as Record<string, string>,
                )}
              />
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {vehicle ? "Save changes" : "Register vehicle"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
