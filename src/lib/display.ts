import type {
  VehicleStatus,
  DriverStatus,
  TripStatus,
  VehicleType,
  LicenseCategory,
  MaintenanceStatus,
  MaintenanceType,
  ExpenseType,
} from "@prisma/client";

export type Tone =
  | "available"
  | "ontrip"
  | "inshop"
  | "retired"
  | "offduty"
  | "suspended"
  | "danger"
  | "accent"
  | "neutral";

/** tone -> tailwind color classes (text + subtle bg + border). */
export const TONE_CLASS: Record<Tone, string> = {
  available: "text-available bg-available/10 border-available/25",
  ontrip: "text-ontrip bg-ontrip/10 border-ontrip/25",
  inshop: "text-inshop bg-inshop/10 border-inshop/25",
  retired: "text-retired bg-retired/10 border-retired/25",
  offduty: "text-offduty bg-offduty/10 border-offduty/25",
  suspended: "text-suspended bg-suspended/10 border-suspended/25",
  danger: "text-danger bg-danger/10 border-danger/25",
  accent: "text-accent bg-accent/10 border-accent/25",
  neutral: "text-muted bg-panel-2 border-line",
};

export const VEHICLE_STATUS_META: Record<VehicleStatus, { label: string; tone: Tone }> = {
  AVAILABLE: { label: "Available", tone: "available" },
  ON_TRIP: { label: "On Trip", tone: "ontrip" },
  IN_SHOP: { label: "In Shop", tone: "inshop" },
  RETIRED: { label: "Retired", tone: "retired" },
};

export const DRIVER_STATUS_META: Record<DriverStatus, { label: string; tone: Tone }> = {
  AVAILABLE: { label: "Available", tone: "available" },
  ON_TRIP: { label: "On Trip", tone: "ontrip" },
  OFF_DUTY: { label: "Off Duty", tone: "offduty" },
  SUSPENDED: { label: "Suspended", tone: "suspended" },
};

/**
 * Effective (operational) status for display. A driver whose duty status is
 * AVAILABLE but whose licence has expired cannot actually be dispatched — the
 * server already excludes them from the pool — so the badge must reflect that
 * rather than a misleading "Available". The stored status is left untouched, so
 * renewing the licence restores availability with no data change.
 */
export function effectiveDriverStatus(
  status: DriverStatus,
  licenceExpired: boolean,
): { label: string; tone: Tone } {
  if (licenceExpired && status === "AVAILABLE") {
    return { label: "Unavailable", tone: "danger" };
  }
  return DRIVER_STATUS_META[status];
}

export const TRIP_STATUS_META: Record<TripStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  DISPATCHED: { label: "Dispatched", tone: "ontrip" },
  COMPLETED: { label: "Completed", tone: "available" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

export const MAINTENANCE_STATUS_META: Record<MaintenanceStatus, { label: string; tone: Tone }> = {
  OPEN: { label: "In Shop", tone: "inshop" },
  CLOSED: { label: "Completed", tone: "available" },
};

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  VAN: "Van",
  TRUCK: "Truck",
  CAR: "Car",
  BUS: "Bus",
  PICKUP: "Pickup",
};

export const LICENSE_LABEL: Record<LicenseCategory, string> = {
  LMV: "LMV — Light Motor Vehicle",
  HMV: "HMV — Heavy Motor Vehicle",
  MCWG: "MCWG — Motorcycle w/ Gear",
  PSV: "PSV — Public Service Vehicle",
  TRANS: "TRANS — Transport / Hazmat",
};

export const MAINTENANCE_TYPE_LABEL: Record<MaintenanceType, string> = {
  OIL_CHANGE: "Oil Change",
  ENGINE_REPAIR: "Engine Repair",
  TIRE_REPLACE: "Tire Replacement",
  BRAKE_SERVICE: "Brake Service",
  INSPECTION: "Inspection",
  BODY_REPAIR: "Body Repair",
  OTHER: "Other",
};

export const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  TOLL: "Toll",
  PARKING: "Parking",
  PERMIT: "Permit",
  FINE: "Fine",
  INSURANCE: "Insurance",
  MISC: "Miscellaneous",
};

export const enumOptions = <T extends Record<string, string>>(labels: T) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
