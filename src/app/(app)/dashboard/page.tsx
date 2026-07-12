"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Truck,
  CircleCheck,
  Wrench,
  Route,
  Clock,
  Users,
  Gauge,
  Activity as ActivityIcon,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { TableSkeleton, ErrorState, EmptyState } from "@/components/ui/States";
import { useApi } from "@/lib/client/api";
import { TRIP_STATUS_META, VEHICLE_TYPE_LABEL, enumOptions } from "@/lib/display";
import { STATE_NAME } from "@/lib/india-map";
import { IndiaFleetMap, MapLegend } from "@/components/IndiaFleetMap";
import { LicenceWatchlist } from "@/components/LicenceWatchlist";
import { formatNumber } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";
import { timeAgo } from "@/lib/format";

const STATUS_BARS = [
  { key: "available", label: "Available", cls: "bg-available" },
  { key: "onTrip", label: "On Trip", cls: "bg-ontrip" },
  { key: "inShop", label: "In Shop", cls: "bg-inshop" },
  { key: "retired", label: "Retired", cls: "bg-retired" },
] as const;

export default function DashboardPage() {
  const [type, setType] = useState("");
  const url = type ? `/api/dashboard?type=${type}` : "/api/dashboard";
  const { data, loading, error, refresh } = useApi<DashboardData>(url, { refreshInterval: 15000 });

  const vsTotal = useMemo(
    () => (data ? Object.values(data.vehicleStatus).reduce((a, b) => a + b, 0) : 0),
    [data],
  );
  const regions = data?.fleetByRegion ?? [];
  const maxRegion = Math.max(1, ...regions.map((r) => r.count));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Fleet operations at a glance — updates live.">
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[{ value: "", label: "All vehicle types" }, ...enumOptions(VEHICLE_TYPE_LABEL)]}
          className="w-44"
        />
      </PageHeader>

      {error && !data ? (
        <Card>
          <ErrorState message={error} onRetry={refresh} />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* KPI instrument row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <Kpi label="Active" value={data?.kpis.activeVehicles ?? "—"} icon={<Truck className="size-3.5" />} tone="ontrip" />
            <Kpi label="Available" value={data?.kpis.availableVehicles ?? "—"} icon={<CircleCheck className="size-3.5" />} tone="available" />
            <Kpi label="In Shop" value={data?.kpis.inMaintenance ?? "—"} icon={<Wrench className="size-3.5" />} tone="inshop" />
            <Kpi label="Active Trips" value={data?.kpis.activeTrips ?? "—"} icon={<Route className="size-3.5" />} tone="ontrip" />
            <Kpi label="Pending Trips" value={data?.kpis.pendingTrips ?? "—"} icon={<Clock className="size-3.5" />} tone="neutral" />
            <Kpi label="Drivers On Duty" value={data?.kpis.driversOnDuty ?? "—"} icon={<Users className="size-3.5" />} tone="accent" />
            <Kpi label="Utilization" value={data?.kpis.fleetUtilization ?? "—"} suffix="%" icon={<Gauge className="size-3.5" />} tone="accent" />
          </div>

          {/* Map + recent trips */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader
                title="Fleet by State"
                subtitle="Active vehicles across India"
                icon={<MapPin className="size-3.5" />}
              />
              <div className="p-3">
                {data ? (
                  <div className="h-64">
                    <IndiaFleetMap data={regions} />
                  </div>
                ) : (
                  <div className="skeleton h-64 rounded-[3px]" />
                )}
              </div>
              <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
                <MapLegend max={maxRegion} />
                <span className="label-tech">{regions.length} states</span>
              </div>
            </Card>

            {/* Live board: trips currently on the road */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Active Trips"
                subtitle={`${data?.kpis.activeTrips ?? 0} currently on the road`}
                icon={<Route className="size-3.5" />}
                action={
                  <Link href="/trips" className="label-tech hover:text-accent">
                    View all →
                  </Link>
                }
              />
              {loading && !data ? (
                <TableSkeleton rows={5} cols={4} />
              ) : data && data.activeTrips.length > 0 ? (
                <div className="divide-y divide-line">
                  {data.activeTrips.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="size-1.5 shrink-0 rounded-full bg-ontrip live-dot" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-fg">
                            {t.source} <span className="text-faint">→</span> {t.destination}
                          </p>
                          <p className="numeric mt-0.5 text-[11px] text-muted">
                            {t.code} · {t.vehicle.registrationNo} · {t.driver.name} ·{" "}
                            {formatNumber(t.cargoWeightKg)} kg
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {t.dispatchedAt && (
                          <span className="label-tech hidden sm:block">
                            {timeAgo(t.dispatchedAt)}
                          </span>
                        )}
                        <StatusBadge
                          tone={TRIP_STATUS_META[t.status].tone}
                          label={TRIP_STATUS_META[t.status].label}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No active trips"
                  message="Dispatch a trip and it will appear here live."
                  icon={<Route className="size-6" />}
                  action={
                    <Link href="/trips">
                      <span className="label-tech text-accent hover:underline">Go to dispatcher →</span>
                    </Link>
                  }
                />
              )}
            </Card>
          </div>

          {/* Compliance + fleet status + activity */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <LicenceWatchlist drivers={data?.expiringLicenses ?? []} />
            <Card>
              <CardHeader title="Vehicle Status" subtitle={`${vsTotal} vehicles`} icon={<Gauge className="size-3.5" />} />
              <div className="space-y-3.5 p-4">
                {STATUS_BARS.map((b) => {
                  const val = data?.vehicleStatus[b.key] ?? 0;
                  const pct = vsTotal ? (val / vsTotal) * 100 : 0;
                  return (
                    <div key={b.key}>
                      <div className="mb-1 flex justify-between">
                        <span className="label-tech">{b.label}</span>
                        <span className="numeric text-xs text-fg">{val}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden bg-panel-2">
                        <div className={`h-full ${b.cls} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader title="Top States" subtitle="By active fleet" icon={<MapPin className="size-3.5" />} />
              <div className="divide-y divide-line">
                {regions.slice(0, 5).map((r) => (
                  <div key={r.region} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-fg">{STATE_NAME[r.region] ?? r.region}</span>
                    <span className="numeric text-sm text-accent">{r.count}</span>
                  </div>
                ))}
                {regions.length === 0 && <EmptyState title="No vehicles" />}
              </div>
            </Card>

            <Card>
              <CardHeader title="Live Activity" subtitle="Recent events" icon={<ActivityIcon className="size-3.5" />} />
              {loading && !data ? (
                <TableSkeleton rows={5} cols={2} />
              ) : data && data.activity.length > 0 ? (
                <div className="divide-y divide-line">
                  {data.activity.slice(0, 6).map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 px-4 py-2">
                      <span className="size-1 shrink-0 rounded-full bg-accent" />
                      <p className="min-w-0 flex-1 truncate text-xs text-fg">{a.summary}</p>
                      <span className="label-tech shrink-0">{timeAgo(a.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No activity yet" />
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
