"use client";
import { useMemo, useState } from "react";
import { Plus, Truck, Search, Pencil, Archive } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, THead, TBody, Th, Td, TRow } from "@/components/ui/Table";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApi, apiFetch, ApiError } from "@/lib/client/api";
import { usePermissions } from "@/components/layout/PermissionsProvider";
import {
  VEHICLE_STATUS_META,
  VEHICLE_TYPE_LABEL,
  enumOptions,
} from "@/lib/display";
import { INDIA_STATES, STATE_NAME } from "@/lib/india-map";
import { formatMoney, formatNumber } from "@/lib/utils";
import type { Vehicle } from "@/lib/types";
import { VehicleFormModal } from "./VehicleFormModal";

export default function VehiclesPage() {
  const { can } = usePermissions();
  const { toast } = useToast();
  const canEdit = can("vehicles", "edit");

  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (status) p.set("status", status);
    if (region) p.set("region", region);
    if (search) p.set("search", search);
    const q = p.toString();
    return `/api/vehicles${q ? `?${q}` : ""}`;
  }, [type, status, region, search]);

  const { data, loading, error, refresh } = useApi<Vehicle[]>(url);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setModalOpen(true);
  };

  const retire = async (v: Vehicle) => {
    if (!confirm(`Retire ${v.registrationNo}? It will be removed from all operations.`)) return;
    try {
      await apiFetch(`/api/vehicles/${v.id}`, { method: "DELETE" });
      toast(`${v.registrationNo} retired`);
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to retire", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Vehicle Registry" subtitle="Master list of every vehicle in the fleet.">
        {canEdit && (
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add Vehicle
          </Button>
        )}
      </PageHeader>

      <Card>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line-soft p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search registration or name…"
              className="pl-9"
            />
          </div>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[{ value: "", label: "All types" }, ...enumOptions(VEHICLE_TYPE_LABEL)]}
            className="w-40"
          />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "", label: "All statuses" },
              ...Object.entries(VEHICLE_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
            ]}
            className="w-40"
          />
          <Select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            options={[
              { value: "", label: "All regions" },
              ...INDIA_STATES.map((s) => ({ value: s.code, label: s.name })),
            ]}
            className="w-44"
          />
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading && !data ? (
          <TableSkeleton rows={6} cols={7} />
        ) : data && data.length > 0 ? (
          <Table>
            <THead>
              <tr>
                <Th>Registration</Th>
                <Th>Name / Model</Th>
                <Th>Type</Th>
                <Th>Region</Th>
                <Th className="text-right">Capacity</Th>
                <Th className="text-right">Odometer</Th>
                <Th className="text-right">Acq. Cost</Th>
                <Th>Status</Th>
                {canEdit && <Th className="text-right">Actions</Th>}
              </tr>
            </THead>
            <TBody>
              {data.map((v) => (
                <TRow key={v.id}>
                  <Td className="numeric font-medium text-fg">{v.registrationNo}</Td>
                  <Td className="text-muted">{v.name}</Td>
                  <Td>{VEHICLE_TYPE_LABEL[v.type]}</Td>
                  <Td className="text-muted">{STATE_NAME[v.region] ?? v.region}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(v.maxLoadKg)} kg</Td>
                  <Td className="text-right tabular-nums">{formatNumber(v.odometerKm)} km</Td>
                  <Td className="text-right tabular-nums">{formatMoney(v.acquisitionCost)}</Td>
                  <Td>
                    <StatusBadge tone={VEHICLE_STATUS_META[v.status].tone} label={VEHICLE_STATUS_META[v.status].label} />
                  </Td>
                  {canEdit && (
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(v)}
                          className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-fg"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        {v.status !== "RETIRED" && (
                          <button
                            onClick={() => retire(v)}
                            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                            title="Retire"
                          >
                            <Archive className="size-4" />
                          </button>
                        )}
                      </div>
                    </Td>
                  )}
                </TRow>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState
            title="No vehicles found"
            message={search || type || status ? "Try adjusting your filters." : "Register your first vehicle to get started."}
            icon={<Truck className="size-6" />}
            action={canEdit && !search && !type && !status ? <Button onClick={openAdd}><Plus className="size-4" /> Add Vehicle</Button> : undefined}
          />
        )}
      </Card>

      {canEdit && (
        <VehicleFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={refresh}
          vehicle={editing}
        />
      )}
    </div>
  );
}
