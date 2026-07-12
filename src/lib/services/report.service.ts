import { prisma } from "@/lib/db";
import { TripStatus, VehicleStatus } from "@prisma/client";

const num = (d: { toNumber(): number } | number | null | undefined): number =>
  d == null ? 0 : typeof d === "number" ? d : d.toNumber();

export type VehicleReportRow = {
  id: string;
  registrationNo: string;
  name: string;
  type: string;
  acquisitionCost: number;
  fuelCost: number;
  fuelLiters: number;
  maintenanceCost: number;
  expenseCost: number;
  revenue: number;
  distanceKm: number;
  operationalCost: number; // fuel + maintenance + expenses
  fuelEfficiency: number; // km per litre
  roi: number; // (revenue - (maintenance + fuel)) / acquisitionCost
};

/**
 * Build the full analytics model: per-vehicle economics plus fleet-wide rollups.
 * All monetary/derived values are computed from live logs, never hardcoded.
 */
export async function getReports() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      fuelLogs: { select: { liters: true, cost: true } },
      maintenanceLogs: { select: { cost: true } },
      expenses: { select: { amount: true } },
      trips: {
        where: { status: TripStatus.COMPLETED },
        select: {
          revenue: true,
          startOdometer: true,
          endOdometer: true,
          fuelConsumedL: true,
          completedAt: true,
        },
      },
    },
    orderBy: { registrationNo: "asc" },
  });

  const rows: VehicleReportRow[] = vehicles.map((v) => {
    const fuelCost = v.fuelLogs.reduce((s, f) => s + num(f.cost), 0);
    const fuelLitersLogged = v.fuelLogs.reduce((s, f) => s + num(f.liters), 0);
    const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + num(m.cost), 0);
    const expenseCost = v.expenses.reduce((s, e) => s + num(e.amount), 0);

    let revenue = 0;
    let distanceKm = 0;
    let tripFuel = 0;
    for (const t of v.trips) {
      revenue += num(t.revenue);
      tripFuel += num(t.fuelConsumedL);
      if (t.endOdometer != null && t.startOdometer != null) {
        distanceKm += Math.max(0, t.endOdometer - t.startOdometer);
      }
    }

    const fuelLiters = fuelLitersLogged + tripFuel;
    const operationalCost = fuelCost + maintenanceCost + expenseCost;
    const fuelEfficiency = fuelLiters > 0 ? distanceKm / fuelLiters : 0;
    const roi =
      num(v.acquisitionCost) > 0
        ? (revenue - (maintenanceCost + fuelCost)) / num(v.acquisitionCost)
        : 0;

    return {
      id: v.id,
      registrationNo: v.registrationNo,
      name: v.name,
      type: v.type,
      acquisitionCost: num(v.acquisitionCost),
      fuelCost,
      fuelLiters,
      maintenanceCost,
      expenseCost,
      revenue,
      distanceKm,
      operationalCost,
      fuelEfficiency: Math.round(fuelEfficiency * 100) / 100,
      roi: Math.round(roi * 1000) / 1000,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.fuelCost += r.fuelCost;
      acc.fuelLiters += r.fuelLiters;
      acc.maintenanceCost += r.maintenanceCost;
      acc.expenseCost += r.expenseCost;
      acc.revenue += r.revenue;
      acc.distanceKm += r.distanceKm;
      acc.operationalCost += r.operationalCost;
      return acc;
    },
    {
      fuelCost: 0,
      fuelLiters: 0,
      maintenanceCost: 0,
      expenseCost: 0,
      revenue: 0,
      distanceKm: 0,
      operationalCost: 0,
    },
  );

  const operationalVehicles = vehicles.filter((v) => v.status !== VehicleStatus.RETIRED).length;
  const onTrip = vehicles.filter((v) => v.status === VehicleStatus.ON_TRIP).length;

  return {
    summary: {
      fuelEfficiency:
        totals.fuelLiters > 0
          ? Math.round((totals.distanceKm / totals.fuelLiters) * 100) / 100
          : 0,
      fleetUtilization:
        operationalVehicles > 0 ? Math.round((onTrip / operationalVehicles) * 100) : 0,
      operationalCost: totals.operationalCost,
      revenue: totals.revenue,
      fleetRoi:
        totals.revenue - (totals.maintenanceCost + totals.fuelCost) > 0 || totals.revenue > 0
          ? Math.round(
              ((totals.revenue - (totals.maintenanceCost + totals.fuelCost)) /
                Math.max(
                  1,
                  vehicles.reduce((s, v) => s + num(v.acquisitionCost), 0),
                )) *
                1000,
            ) / 1000
          : 0,
    },
    vehicles: rows,
    topCostVehicles: [...rows].sort((a, b) => b.operationalCost - a.operationalCost).slice(0, 5),
    monthlyRevenue: buildMonthlyRevenue(vehicles.flatMap((v) => v.trips)),
    generatedAt: new Date(),
  };
}

/** Last 6 months of completed-trip revenue for the trend chart. */
function buildMonthlyRevenue(
  trips: { revenue: { toNumber(): number } | number; completedAt: Date | null }[],
) {
  const months: { key: string; label: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      revenue: 0,
    });
  }
  for (const t of trips) {
    if (!t.completedAt) continue;
    const d = new Date(t.completedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.revenue += num(t.revenue);
  }
  return months.map(({ label, revenue }) => ({ label, revenue }));
}
