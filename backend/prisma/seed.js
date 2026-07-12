import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean up existing data to prevent duplicate unique key errors
  await prisma.expenseLog.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create default users for all 4 roles
  const hashedPassword = await bcrypt.hash('password', 10);

  const manager = await prisma.user.create({
    data: {
      email: 'manager@transitops.com',
      password: hashedPassword,
      role: 'Manager',
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@transitops.com',
      password: hashedPassword,
      role: 'Driver',
    },
  });

  const safetyUser = await prisma.user.create({
    data: {
      email: 'safety@transitops.com',
      password: hashedPassword,
      role: 'Safety_Officer',
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      email: 'analyst@transitops.com',
      password: hashedPassword,
      role: 'Financial_Analyst',
    },
  });

  console.log('Users created:', { manager: manager.email, driver: driverUser.email, safety: safetyUser.email, analyst: analystUser.email });

  // 3. Create default Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      name: 'Ford Transit',
      model: '2023 Cargo 250',
      category: 'Van',
      licensePlate: 'MH-12-PQ-1234',
      maxCapacity: 1200,
      odometer: 15000,
      acquisitionCost: 1500000,
      status: 'Available',
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      name: 'Tata Ultra',
      model: 'T.7 110 LPT',
      category: 'Truck',
      licensePlate: 'MH-12-PQ-5678',
      maxCapacity: 5000,
      odometer: 45000,
      acquisitionCost: 2800000,
      status: 'Available',
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      name: 'BharatBenz 2823R',
      model: '6x2 Rigid Truck',
      category: 'Heavy_Truck',
      licensePlate: 'MH-12-PQ-9999',
      maxCapacity: 18000,
      odometer: 82000,
      acquisitionCost: 4500000,
      status: 'Available',
    },
  });

  console.log('Vehicles created:', [vehicle1.name, vehicle2.name, vehicle3.name]);

  // 4. Create default Drivers
  const driver1 = await prisma.driver.create({
    data: {
      name: 'Keval Patel',
      licenseNumber: 'DL-MH12-2021-0001',
      licenseCategory: 'Van',
      licenseExpiryDate: new Date('2028-12-31'),
      contactNumber: '+91 98765 43210',
      safetyScore: 95,
      status: 'Available',
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      name: 'Vatsal Vachheta',
      licenseNumber: 'DL-MH12-2020-0002',
      licenseCategory: 'Truck',
      licenseExpiryDate: new Date('2027-06-30'),
      contactNumber: '+91 98765 43211',
      safetyScore: 88,
      status: 'Available',
    },
  });

  const driver3 = await prisma.driver.create({
    data: {
      name: 'Kavish Shah',
      licenseNumber: 'DL-MH12-2018-0003',
      licenseCategory: 'Heavy_Truck',
      licenseExpiryDate: new Date('2029-03-15'),
      contactNumber: '+91 98765 43212',
      safetyScore: 68, // Low score to test "Attention Required" flagging
      status: 'Available',
    },
  });

  console.log('Drivers created:', [driver1.name, driver2.name, driver3.name]);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
