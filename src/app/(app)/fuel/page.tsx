"use client";
import { useMemo, useState } from "react";
import { Plus, Fuel, Receipt, Droplets } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { Table, THead, TBody, Th, Td, TRow } from "@/components/ui/Table";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApi, apiFetch, ApiError } from "@/lib/client/api";
import { usePermissions } from "@/components/layout/PermissionsProvider";
import { EXPENSE_TYPE_LABEL, enumOptions } from "@/lib/display";
import { formatMoney, formatNumber } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { FuelLog, Expense, Vehicle } from "@/lib/types";

export default function FuelPage() {
  const { can } = usePermissions();
  const canEdit = can("fuel", "edit");
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const fuel = useApi<FuelLog[]>("/api/fuel", { refreshInterval: 25000 });
  const expenses = useApi<Expense[]>("/api/expenses", { refreshInterval: 25000 });

  const totals = useMemo(() => {
    const fuelCost = (fuel.data ?? []).reduce((s, f) => s + f.cost, 0);
    const expenseCost = (expenses.data ?? []).reduce((s, e) => s + e.amount, 0);
    const liters = (fuel.data ?? []).reduce((s, f) => s + f.liters, 0);
    return { fuelCost, expenseCost, liters, total: fuelCost + expenseCost };
  }, [fuel.data, expenses.data]);

  return (
    <div>
      <PageHeader title="Fuel & Expense Management" subtitle="Track fuel consumption and other operational expenses.">
        {canEdit && (
          <>
            <Button variant="secondary" onClick={() => setExpenseOpen(true)}>
              <Receipt className="size-4" /> Add Expense
            </Button>
            <Button onClick={() => setFuelOpen(true)}>
              <Plus className="size-4" /> Log Fuel
            </Button>
          </>
        )}
      </PageHeader>

      {/* Totals */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Fuel Cost" value={formatMoney(totals.fuelCost)} />
        <MiniStat label="Fuel Volume" value={`${formatNumber(totals.liters)} L`} />
        <MiniStat label="Other Expenses" value={formatMoney(totals.expenseCost)} />
        <MiniStat label="Total Operational Cost" value={formatMoney(totals.total)} accent />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Fuel logs */}
        <Card>
          <CardHeader title="Fuel Logs" subtitle="Litres, cost and date" icon={<Droplets className="size-4" />} />
          {fuel.error && !fuel.data ? (
            <ErrorState message={fuel.error} onRetry={fuel.refresh} />
          ) : fuel.loading && !fuel.data ? (
            <TableSkeleton rows={5} cols={4} />
          ) : fuel.data && fuel.data.length > 0 ? (
            <Table className="min-w-0">
              <THead>
                <tr>
                  <Th>Vehicle</Th>
                  <Th className="text-right">Litres</Th>
                  <Th className="text-right">Cost</Th>
                  <Th>Date</Th>
                </tr>
              </THead>
              <TBody>
                {fuel.data.map((f) => (
                  <TRow key={f.id}>
                    <Td className="font-medium text-fg">{f.vehicle.registrationNo}</Td>
                    <Td className="text-right tabular-nums">{formatNumber(f.liters)} L</Td>
                    <Td className="text-right tabular-nums">{formatMoney(f.cost)}</Td>
                    <Td className="text-muted">{formatDate(f.filledAt)}</Td>
                  </TRow>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState title="No fuel logs" message="Log a fill-up to track efficiency." icon={<Fuel className="size-6" />} />
          )}
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader title="Other Expenses" subtitle="Tolls, permits, fines & more" icon={<Receipt className="size-4" />} />
          {expenses.error && !expenses.data ? (
            <ErrorState message={expenses.error} onRetry={expenses.refresh} />
          ) : expenses.loading && !expenses.data ? (
            <TableSkeleton rows={5} cols={4} />
          ) : expenses.data && expenses.data.length > 0 ? (
            <Table className="min-w-0">
              <THead>
                <tr>
                  <Th>Vehicle</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Date</Th>
                </tr>
              </THead>
              <TBody>
                {expenses.data.map((e) => (
                  <TRow key={e.id}>
                    <Td className="font-medium text-fg">{e.vehicle.registrationNo}</Td>
                    <Td>{EXPENSE_TYPE_LABEL[e.type]}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(e.amount)}</Td>
                    <Td className="text-muted">{formatDate(e.spentAt)}</Td>
                  </TRow>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState title="No expenses" message="Record tolls, permits or fines here." icon={<Receipt className="size-6" />} />
          )}
        </Card>
      </div>

      {canEdit && <FuelModal open={fuelOpen} onClose={() => setFuelOpen(false)} onSaved={fuel.refresh} />}
      {canEdit && <ExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} onSaved={expenses.refresh} />}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card p-4 ${accent ? "glow-accent" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-1.5 text-lg font-semibold tabular-nums ${accent ? "text-accent" : "text-fg"}`}>{value}</p>
    </div>
  );
}

function useVehicleOptions(open: boolean) {
  const { data } = useApi<Vehicle[]>(open ? "/api/vehicles" : null);
  return (data ?? []).map((v) => ({ value: v.id, label: `${v.registrationNo} · ${v.name}` }));
}

function FuelModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const options = useVehicleOptions(open);
  const [form, setForm] = useState({ vehicleId: "", liters: "", cost: "", odometerKm: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/api/fuel", {
        method: "POST",
        body: { vehicleId: form.vehicleId, liters: Number(form.liters), cost: Number(form.cost), ...(form.odometerKm ? { odometerKm: Number(form.odometerKm) } : {}) },
      });
      toast("Fuel logged");
      setForm({ vehicleId: "", liters: "", cost: "", odometerKm: "" });
      onSaved();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to log fuel", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Log Fuel" description="Record a fill-up.">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Vehicle">
          <Select value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} options={options} placeholder="Select vehicle" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Litres">
            <Input type="number" step="0.1" value={form.liters} onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))} required />
          </Field>
          <Field label="Cost (₹)">
            <Input type="number" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} required />
          </Field>
        </div>
        <Field label="Odometer (km)">
          <Input type="number" value={form.odometerKm} onChange={(e) => setForm((f) => ({ ...f, odometerKm: e.target.value }))} placeholder="Optional" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Log fuel</Button>
        </div>
      </form>
    </Modal>
  );
}

function ExpenseModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const options = useVehicleOptions(open);
  const [form, setForm] = useState({ vehicleId: "", type: "TOLL" as string, amount: "", note: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/api/expenses", {
        method: "POST",
        body: { vehicleId: form.vehicleId, type: form.type, amount: Number(form.amount), note: form.note || undefined },
      });
      toast("Expense recorded");
      setForm({ vehicleId: "", type: "TOLL", amount: "", note: "" });
      onSaved();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to record expense", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense" description="Record a toll, permit, fine or other cost.">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Vehicle">
          <Select value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} options={options} placeholder="Select vehicle" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={enumOptions(EXPENSE_TYPE_LABEL)} />
          </Field>
          <Field label="Amount (₹)">
            <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
          </Field>
        </div>
        <Field label="Note">
          <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Record expense</Button>
        </div>
      </form>
    </Modal>
  );
}
