import type {
  VehicleStatus,
  VehicleType,
  DriverStatus,
  LicenseCategory,
  TripStatus,
  MaintenanceStatus,
  MaintenanceType,
  ExpenseType,
  RoleKey,
  Region,
  AuditAction,
} from "@prisma/client";
import type { PermissionMap } from "@/lib/auth/rbac";

// Client-facing shapes (Decimals serialized to number, Dates to ISO strings).

export type Vehicle = {
  id: string;
  registrationNo: string;
  name: string;
  type: VehicleType;
  maxLoadKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: Region;
  createdAt: string;
  updatedAt: string;
};

export type Driver = {
  id: string;
  name: string;
  licenseNo: string;
  licenseCategory: LicenseCategory;
  licenseExpiry: string;
  contact: string;
  email: string | null;
  safetyScore: number;
  status: DriverStatus;
  suspensionReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
};

/** A driver on the licence-compliance watchlist. */
export type ExpiringLicence = {
  id: string;
  name: string;
  licenseNo: string;
  licenseExpiry: string;
  status: DriverStatus;
};

export type Trip = {
  id: string;
  code: string;
  source: string;
  destination: string;
  cargoWeightKg: number;
  plannedDistance: number;
  status: TripStatus;
  revenue: number;
  startOdometer: number | null;
  endOdometer: number | null;
  fuelConsumedL: number | null;
  dispatchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  vehicle: { id: string; registrationNo: string; name: string; maxLoadKg: number };
  driver: { id: string; name: string; licenseNo: string };
};

export type Maintenance = {
  id: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  odometerKm: number | null;
  status: MaintenanceStatus;
  openedAt: string;
  closedAt: string | null;
  vehicle: { id: string; registrationNo: string; name: string; status: VehicleStatus };
};

export type FuelLog = {
  id: string;
  liters: number;
  cost: number;
  odometerKm: number | null;
  filledAt: string;
  vehicle: { id: string; registrationNo: string; name: string };
  trip: { id: string; code: string } | null;
};

export type Expense = {
  id: string;
  type: ExpenseType;
  amount: number;
  note: string | null;
  spentAt: string;
  vehicle: { id: string; registrationNo: string; name: string };
  trip: { id: string; code: string } | null;
};

export type Activity = {
  id: string;
  entity: string;
  action: AuditAction;
  summary: string;
  createdAt: string;
  actor: { name: string } | null;
};

export type DashboardData = {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    inMaintenance: number;
    retiredVehicles: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilization: number;
  };
  vehicleStatus: { available: number; onTrip: number; inShop: number; retired: number };
  fleetByRegion: { region: Region; count: number }[];
  driverStatus: { available: number; onTrip: number; offDuty: number; suspended: number };
  /** Trips currently on the road (DISPATCHED) — the live board. */
  activeTrips: (Pick<
    Trip,
    "id" | "code" | "source" | "destination" | "status" | "cargoWeightKg" | "plannedDistance" | "dispatchedAt"
  > & {
    vehicle: { registrationNo: string };
    driver: { name: string };
  })[];
  activity: Activity[];
  expiringLicenses: ExpiringLicence[];
  updatedAt: string;
};

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
  operationalCost: number;
  fuelEfficiency: number;
  roi: number;
};

export type ReportData = {
  summary: {
    fuelEfficiency: number;
    fleetUtilization: number;
    operationalCost: number;
    revenue: number;
    fleetRoi: number;
  };
  vehicles: VehicleReportRow[];
  topCostVehicles: VehicleReportRow[];
  monthlyRevenue: { label: string; revenue: number }[];
  generatedAt: string;
};

export type RoleRow = {
  id: string;
  key: RoleKey;
  name: string;
  description: string | null;
  userCount: number;
  permissions: PermissionMap;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
  role: { key: RoleKey; name: string };
};
