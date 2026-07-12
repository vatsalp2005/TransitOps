import { prisma } from "@/lib/db";
import {
  Prisma,
  VehicleStatus,
  DriverStatus,
  TripStatus,
  VehicleType,
} from "@prisma/client";
import { recentActivity } from "./audit";
import { expiringLicenses } from "./driver.service";

export type DashboardFilters = { type?: VehicleType };

export async function getDashboard(filters: DashboardFilters = {}) {
  const vehicleWhere: Prisma.VehicleWhereInput = filters.type ? { type: filters.type } : {};

  const [vehicleGroups, regionGroups, tripGroups, driverGroups, activeTrips, activity, expiring] =
    await Promise.all([
    prisma.vehicle.groupBy({ by: ["status"], where: vehicleWhere, _count: { _all: true } }),
    // Fleet count per Indian state — powers the map.
    prisma.vehicle.groupBy({
      by: ["region"],
      where: { ...vehicleWhere, status: { not: VehicleStatus.RETIRED } },
      _count: { _all: true },
    }),
    prisma.trip.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.driver.groupBy({ by: ["status"], _count: { _all: true } }),
    // Live board: trips currently out on the road.
    prisma.trip.findMany({
      where: { status: TripStatus.DISPATCHED },
      orderBy: { dispatchedAt: "desc" },
      take: 8,
      include: {
        vehicle: { select: { registrationNo: true } },
        driver: { select: { name: true } },
      },
    }),
    recentActivity(8),
    // Compliance: licences expired or expiring within 30 days.
    expiringLicenses(30),
  ]);

  const vCount = (s: VehicleStatus) =>
    vehicleGroups.find((g) => g.status === s)?._count._all ?? 0;
  const tCount = (s: TripStatus) => tripGroups.find((g) => g.status === s)?._count._all ?? 0;
  const dCount = (s: DriverStatus) => driverGroups.find((g) => g.status === s)?._count._all ?? 0;

  const available = vCount(VehicleStatus.AVAILABLE);
  const onTrip = vCount(VehicleStatus.ON_TRIP);
  const inShop = vCount(VehicleStatus.IN_SHOP);
  const retired = vCount(VehicleStatus.RETIRED);
  const operational = available + onTrip + inShop; // excludes retired

  return {
    kpis: {
      activeVehicles: onTrip,
      availableVehicles: available,
      inMaintenance: inShop,
      retiredVehicles: retired,
      activeTrips: tCount(TripStatus.DISPATCHED),
      pendingTrips: tCount(TripStatus.DRAFT),
      driversOnDuty: dCount(DriverStatus.ON_TRIP),
      fleetUtilization: operational > 0 ? Math.round((onTrip / operational) * 100) : 0,
    },
    vehicleStatus: {
      available,
      onTrip,
      inShop,
      retired,
    },
    /** [{ region: "MH", count: 4 }, …] — active fleet by Indian state. */
    fleetByRegion: regionGroups
      .map((g) => ({ region: g.region, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    driverStatus: {
      available: dCount(DriverStatus.AVAILABLE),
      onTrip: dCount(DriverStatus.ON_TRIP),
      offDuty: dCount(DriverStatus.OFF_DUTY),
      suspended: dCount(DriverStatus.SUSPENDED),
    },
    activeTrips,
    activity,
    /** Compliance watchlist: licences expired or expiring within 30 days. */
    expiringLicenses: expiring.map((d) => ({
      id: d.id,
      name: d.name,
      licenseNo: d.licenseNo,
      licenseExpiry: d.licenseExpiry,
      status: d.status,
    })),
    updatedAt: new Date(),
  };
}
