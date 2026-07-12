/**
 * Seed realistic, business-rule-consistent demo data for TransitOps.
 * Idempotent: wipes and reinserts on every run.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS, ROLE_LABELS } from "../src/lib/auth/rbac";

// Load .env into process.env (Node 20.12+ built-in) so the adapter sees DATABASE_URL.
try {
  process.loadEnvFile();
} catch {
  /* .env optional in CI */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Transit@2026";

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}
function monthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

async function main() {
  console.log("Resetting database…");
  // Delete in FK-safe order.
  await prisma.auditLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  console.log("Seeding roles…");
  const roleKeys = ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] as const;
  const roles: Record<string, string> = {};
  for (const key of roleKeys) {
    const role = await prisma.role.create({
      data: {
        key,
        name: ROLE_LABELS[key],
        description: `${ROLE_LABELS[key]} access profile`,
        permissions: ROLE_PERMISSIONS[key],
      },
    });
    roles[key] = role.id;
  }

  console.log("Seeding users…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [
    { email: "kavish@gmail.com", name: "Kavish", role: "FLEET_MANAGER" },
    { email: "vatsal@gmail.com", name: "Vatsal", role: "DRIVER" },
    { email: "harsh@gmail.com", name: "Harsh", role: "SAFETY_OFFICER" },
    { email: "keval@gmail.com", name: "Keval", role: "FINANCIAL_ANALYST" },
  ];
  const userIds: Record<string, string> = {};
  for (const u of users) {
    const created = await prisma.user.create({
      data: { email: u.email, name: u.name, passwordHash, roleId: roles[u.role] },
    });
    userIds[u.role] = created.id;
  }
  const manager = userIds.FLEET_MANAGER;
  const dispatcher = userIds.DRIVER;

  console.log("Seeding vehicles…");
  const v = {
    ace: await prisma.vehicle.create({
      data: { registrationNo: "MH-01-AB-1234", name: "Tata Ace Gold", type: "VAN", maxLoadKg: 750, odometerKm: 45200, acquisitionCost: 620000, status: "AVAILABLE", region: "MH" },
    }),
    dost: await prisma.vehicle.create({
      data: { registrationNo: "GJ-02-CD-5678", name: "Ashok Leyland Dost+", type: "PICKUP", maxLoadKg: 1250, odometerKm: 78900, acquisitionCost: 890000, status: "AVAILABLE", region: "GJ" },
    }),
    eicher: await prisma.vehicle.create({
      data: { registrationNo: "MH-03-EF-9012", name: "Eicher Pro 2049", type: "TRUCK", maxLoadKg: 5000, odometerKm: 132400, acquisitionCost: 1850000, status: "ON_TRIP", region: "MH" },
    }),
    tempo: await prisma.vehicle.create({
      data: { registrationNo: "KA-04-GH-3456", name: "Force Traveller", type: "BUS", maxLoadKg: 2000, odometerKm: 98700, acquisitionCost: 1650000, status: "AVAILABLE", region: "KA" },
    }),
    bolero: await prisma.vehicle.create({
      data: { registrationNo: "RJ-05-IJ-7890", name: "Mahindra Bolero Pik-Up", type: "PICKUP", maxLoadKg: 1500, odometerKm: 54300, acquisitionCost: 940000, status: "IN_SHOP", region: "RJ" },
    }),
    swift: await prisma.vehicle.create({
      data: { registrationNo: "DL-06-KL-2345", name: "Maruti Dzire Tour", type: "CAR", maxLoadKg: 400, odometerKm: 112000, acquisitionCost: 720000, status: "AVAILABLE", region: "DL" },
    }),
    prima: await prisma.vehicle.create({
      data: { registrationNo: "TN-07-MN-6789", name: "Tata Prima 3718", type: "TRUCK", maxLoadKg: 25000, odometerKm: 210500, acquisitionCost: 4200000, status: "AVAILABLE", region: "TN" },
    }),
    canter: await prisma.vehicle.create({
      data: { registrationNo: "GJ-09-QR-4455", name: "Tata Ultra 1518", type: "TRUCK", maxLoadKg: 9000, odometerKm: 64100, acquisitionCost: 2350000, status: "AVAILABLE", region: "GJ" },
    }),
    winger: await prisma.vehicle.create({
      data: { registrationNo: "UP-10-ST-8899", name: "Tata Winger Cargo", type: "VAN", maxLoadKg: 1000, odometerKm: 39500, acquisitionCost: 980000, status: "AVAILABLE", region: "UP" },
    }),
    intra: await prisma.vehicle.create({
      data: { registrationNo: "MH-11-UV-2211", name: "Tata Intra V30", type: "PICKUP", maxLoadKg: 1300, odometerKm: 27800, acquisitionCost: 810000, status: "AVAILABLE", region: "MH" },
    }),
    old: await prisma.vehicle.create({
      data: { registrationNo: "UP-08-OP-1122", name: "Tata 407 (legacy)", type: "TRUCK", maxLoadKg: 2500, odometerKm: 320000, acquisitionCost: 780000, status: "RETIRED", region: "UP" },
    }),
  };

  console.log("Seeding drivers…");
  const d = {
    alex: await prisma.driver.create({
      data: { name: "Alex D'Souza", licenseNo: "DL-MH-2019-0001", licenseCategory: "LMV", licenseExpiry: daysFromNow(420), contact: "+91 98200 11223", safetyScore: 92, status: "AVAILABLE" },
    }),
    john: await prisma.driver.create({
      data: { name: "John Mathew", licenseNo: "DL-MH-2018-0442", licenseCategory: "HMV", licenseExpiry: daysFromNow(210), contact: "+91 98200 44556", safetyScore: 88, status: "ON_TRIP" },
    }),
    // Licence expires in 12 days -> lands on the compliance watchlist.
    priya: await prisma.driver.create({
      data: { name: "Priyanka Shah", licenseNo: "DL-MH-2020-0873", licenseCategory: "HMV", licenseExpiry: daysFromNow(12), contact: "+91 98200 77889", safetyScore: 95, status: "AVAILABLE" },
    }),
    // Licence already expired -> blocked from dispatch, and on the watchlist.
    sameer: await prisma.driver.create({
      data: { name: "Sameer Ali", licenseNo: "DL-MH-2017-0210", licenseCategory: "TRANS", licenseExpiry: daysFromNow(-20), contact: "+91 98200 33221", safetyScore: 71, status: "AVAILABLE" },
    }),
    rita: await prisma.driver.create({
      data: { name: "Rita Fernandes", licenseNo: "DL-MH-2021-0555", licenseCategory: "LMV", licenseExpiry: daysFromNow(680), contact: "+91 98200 66554", safetyScore: 84, status: "OFF_DUTY" },
    }),
    // Suspended with a recorded reason (compliance workflow).
    deepak: await prisma.driver.create({
      data: {
        name: "Deepak Kumar", licenseNo: "DL-MH-2016-0099", licenseCategory: "HMV",
        licenseExpiry: daysFromNow(150), contact: "+91 98200 99001", safetyScore: 48,
        status: "SUSPENDED",
        suspensionReason: "Safety score below threshold after repeated overspeeding violations",
        suspendedAt: monthsAgo(1),
      },
    }),
  };

  console.log("Seeding trips…");
  // Active dispatched trip — vehicle + driver are ON_TRIP (consistent).
  await prisma.trip.create({
    data: {
      code: "TRP-0001", source: "Mumbai Port", destination: "Pune Warehouse",
      vehicleId: v.eicher.id, driverId: d.john.id, cargoWeightKg: 4200, plannedDistance: 165,
      status: "DISPATCHED", revenue: 28000, startOdometer: 132400, dispatchedAt: monthsAgo(0),
      createdById: dispatcher,
    },
  });
  // Completed trips (fuel + odometer + revenue) across recent months for analytics.
  const completed = [
    { code: "TRP-0002", veh: v.ace, drv: d.alex, src: "Thane", dst: "Nashik", cargo: 600, dist: 168, start: 44800, end: 45200, fuel: 22, rev: 15500, m: 0 },
    { code: "TRP-0003", veh: v.dost, drv: d.priya, src: "Mumbai", dst: "Surat", cargo: 1100, dist: 290, start: 78300, end: 78900, fuel: 41, rev: 26800, m: 1 },
    { code: "TRP-0004", veh: v.prima, drv: d.john, src: "JNPT", dst: "Nagpur", cargo: 22000, dist: 820, start: 209200, end: 210500, fuel: 240, rev: 118000, m: 1 },
    { code: "TRP-0005", veh: v.swift, drv: d.alex, src: "Andheri", dst: "Lonavala", cargo: 300, dist: 96, start: 111700, end: 112000, fuel: 14, rev: 8200, m: 2 },
    { code: "TRP-0006", veh: v.tempo, drv: d.rita, src: "Dadar", dst: "Shirdi", cargo: 1400, dist: 240, start: 98300, end: 98700, fuel: 55, rev: 31000, m: 3 },
    { code: "TRP-0007", veh: v.ace, drv: d.alex, src: "Vashi", dst: "Panvel", cargo: 550, dist: 42, start: 44600, end: 44800, fuel: 7, rev: 4800, m: 4 },
  ];
  for (const t of completed) {
    await prisma.trip.create({
      data: {
        code: t.code, source: t.src, destination: t.dst, vehicleId: t.veh.id, driverId: t.drv.id,
        cargoWeightKg: t.cargo, plannedDistance: t.dist, status: "COMPLETED", revenue: t.rev,
        startOdometer: t.start, endOdometer: t.end, fuelConsumedL: t.fuel,
        dispatchedAt: monthsAgo(t.m), completedAt: monthsAgo(t.m), createdById: dispatcher,
      },
    });
  }
  // Draft (planned, not yet dispatched) + a cancelled trip.
  await prisma.trip.create({
    data: {
      code: "TRP-0008", source: "Kalyan", destination: "Aurangabad", vehicleId: v.dost.id,
      driverId: d.alex.id, cargoWeightKg: 900, plannedDistance: 335, status: "DRAFT",
      revenue: 34000, createdById: dispatcher,
    },
  });
  await prisma.trip.create({
    data: {
      code: "TRP-0009", source: "Borivali", destination: "Vapi", vehicleId: v.swift.id,
      driverId: d.priya.id, cargoWeightKg: 350, plannedDistance: 172, status: "CANCELLED",
      revenue: 0, cancelledAt: monthsAgo(1), createdById: dispatcher,
    },
  });

  console.log("Seeding maintenance…");
  // Open job on the IN_SHOP vehicle (consistent with its status).
  await prisma.maintenanceLog.create({
    data: { vehicleId: v.bolero.id, type: "ENGINE_REPAIR", description: "Coolant leak + timing belt", cost: 18400, odometerKm: 54300, status: "OPEN" },
  });
  const closedMaint = [
    { veh: v.ace, type: "OIL_CHANGE" as const, desc: "Routine oil + filter change", cost: 3200, m: 2 },
    { veh: v.prima, type: "TIRE_REPLACE" as const, desc: "2 rear tyres replaced", cost: 42000, m: 1 },
    { veh: v.eicher, type: "BRAKE_SERVICE" as const, desc: "Brake pads + fluid", cost: 9600, m: 3 },
    { veh: v.tempo, type: "INSPECTION" as const, desc: "Annual fitness inspection", cost: 5400, m: 4 },
  ];
  for (const m of closedMaint) {
    await prisma.maintenanceLog.create({
      data: { vehicleId: m.veh.id, type: m.type, description: m.desc, cost: m.cost, status: "CLOSED", openedAt: monthsAgo(m.m), closedAt: monthsAgo(m.m) },
    });
  }

  console.log("Seeding fuel logs…");
  const fuel = [
    { veh: v.ace, l: 22, c: 2200, m: 0 }, { veh: v.dost, l: 41, c: 4100, m: 1 },
    { veh: v.prima, l: 240, c: 24000, m: 1 }, { veh: v.eicher, l: 60, c: 6000, m: 0 },
    { veh: v.swift, l: 14, c: 1400, m: 2 }, { veh: v.tempo, l: 55, c: 5500, m: 3 },
    { veh: v.prima, l: 210, c: 21000, m: 2 }, { veh: v.ace, l: 18, c: 1800, m: 3 },
  ];
  for (const f of fuel) {
    await prisma.fuelLog.create({
      data: { vehicleId: f.veh.id, liters: f.l, cost: f.c, filledAt: monthsAgo(f.m) },
    });
  }

  console.log("Seeding expenses…");
  const expenses = [
    { veh: v.prima, type: "TOLL" as const, amt: 3400, note: "Mumbai-Nagpur expressway", m: 1 },
    { veh: v.eicher, type: "TOLL" as const, amt: 1200, note: "Mumbai-Pune expressway", m: 0 },
    { veh: v.tempo, type: "PERMIT" as const, amt: 2800, note: "Interstate permit renewal", m: 3 },
    { veh: v.dost, type: "PARKING" as const, amt: 450, note: "Surat depot parking", m: 1 },
    { veh: v.swift, type: "FINE" as const, amt: 1000, note: "Overspeed challan", m: 2 },
  ];
  for (const e of expenses) {
    await prisma.expense.create({
      data: { vehicleId: e.veh.id, type: e.type, amount: e.amt, note: e.note, spentAt: monthsAgo(e.m) },
    });
  }

  console.log("Seeding audit trail…");
  await prisma.auditLog.createMany({
    data: [
      { entity: "Trip", entityId: "seed", action: "DISPATCH", summary: "Dispatched trip TRP-0001", actorId: dispatcher },
      { entity: "Vehicle", entityId: v.bolero.id, action: "MAINTENANCE_OPEN", summary: "MH-05-IJ-7890 sent to shop: Coolant leak + timing belt", actorId: manager },
      { entity: "Trip", entityId: "seed", action: "COMPLETE", summary: "Completed trip TRP-0004", actorId: dispatcher },
      { entity: "Driver", entityId: d.deepak.id, action: "UPDATE", summary: "Suspended driver Deepak Kumar (safety score 48)", actorId: manager },
    ],
  });

  console.log("\n✅ Seed complete.");
  console.log(`   Users (password: ${DEMO_PASSWORD}):`);
  users.forEach((u) => console.log(`     • ${u.email}  —  ${ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
