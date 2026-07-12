import { prisma } from '../config/db.js';

// Normalization and mapping helper to match Mongoose output format
const toDisplayTrip = (t) => {
    if (!t) return null;
    return {
        _id: t.id,
        id: t.id,
        cargoWeight: t.cargoWeight,
        origin: t.origin,
        destination: t.destination,
        plannedDistance: t.plannedDistance,
        revenue: t.revenue,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        vehicleId: t.vehicle ? {
            _id: t.vehicle.id,
            id: t.vehicle.id,
            name: t.vehicle.name,
            model: t.vehicle.model,
            category: t.vehicle.category.replace('_', ' '),
            licensePlate: t.vehicle.licensePlate,
            maxCapacity: t.vehicle.maxCapacity,
            odometer: t.vehicle.odometer,
            status: t.vehicle.status.replace('_', ' ')
        } : null,
        driverId: t.driver ? {
            _id: t.driver.id,
            id: t.driver.id,
            name: t.driver.name,
            licenseNumber: t.driver.licenseNumber,
            licenseCategory: t.driver.licenseCategory.replace('_', ' '),
            licenseExpiryDate: t.driver.licenseExpiryDate,
            contactNumber: t.driver.contactNumber,
            safetyScore: t.driver.safetyScore,
            totalTrips: t.driver.totalTrips,
            completedTrips: t.driver.completedTrips,
            status: t.driver.status.replace('_', ' ')
        } : null
    };
};

export const getTrips = async (req, res) => {
    try {
        const trips = await prisma.trip.findMany({
            include: { vehicle: true, driver: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(trips.map(toDisplayTrip));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const createTrip = async (req, res) => {
    try {
        const { vehicleId, driverId, cargoWeight, origin, destination, plannedDistance, revenue } = req.body;

        // Validation
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        if (vehicle.status !== 'Available') return res.status(400).json({ message: 'Vehicle is not available' });
        if (Number(cargoWeight) > vehicle.maxCapacity) return res.status(400).json({ message: 'Cargo weight exceeds vehicle capacity' });

        const driver = await prisma.driver.findUnique({ where: { id: driverId } });
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        if (driver.status !== 'Available') return res.status(400).json({ message: 'Driver is not available' });
        if (new Date(driver.licenseExpiryDate) < new Date()) return res.status(400).json({ message: 'Driver license expired' });

        // Category compliance check
        if (vehicle.category !== driver.licenseCategory) {
            return res.status(400).json({
                message: `Driver license category (${driver.licenseCategory.replace('_', ' ')}) does not match vehicle category (${vehicle.category.replace('_', ' ')})`
            });
        }

        // Create transaction to save Trip and update statuses
        const trip = await prisma.$transaction(async (tx) => {
            const newTrip = await tx.trip.create({
                data: {
                    vehicleId,
                    driverId,
                    cargoWeight: Number(cargoWeight),
                    origin,
                    destination,
                    plannedDistance: plannedDistance ? Number(plannedDistance) : 0,
                    revenue: revenue ? Number(revenue) : 0,
                    status: 'Dispatched'
                },
                include: { vehicle: true, driver: true }
            });

            await tx.vehicle.update({
                where: { id: vehicleId },
                data: { status: 'On_Trip' }
            });

            await tx.driver.update({
                where: { id: driverId },
                data: {
                    status: 'On_Trip',
                    totalTrips: driver.totalTrips + 1
                }
            });

            return newTrip;
        });

        res.status(201).json(toDisplayTrip(trip));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const completeTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const { finalOdometer } = req.body;

        const trip = await prisma.trip.findUnique({
            where: { id },
            include: { vehicle: true, driver: true }
        });
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'Dispatched') return res.status(400).json({ message: 'Trip is not currently dispatched' });

        if (finalOdometer) {
            if (Number(finalOdometer) < trip.vehicle.odometer) {
                return res.status(400).json({ message: 'Final odometer cannot be less than current odometer' });
            }
        }

        const updatedTrip = await prisma.$transaction(async (tx) => {
            const completed = await tx.trip.update({
                where: { id },
                data: { status: 'Completed' },
                include: { vehicle: true, driver: true }
            });

            await tx.vehicle.update({
                where: { id: trip.vehicleId },
                data: {
                    status: 'Available',
                    odometer: finalOdometer ? Number(finalOdometer) : trip.vehicle.odometer
                }
            });

            await tx.driver.update({
                where: { id: trip.driverId },
                data: {
                    status: 'Available',
                    completedTrips: trip.driver.completedTrips + 1
                }
            });

            return completed;
        });

        res.json({ message: 'Trip completed successfully', trip: toDisplayTrip(updatedTrip) });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const updateTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const currentTrip = await prisma.trip.findUnique({ where: { id } });
        if (!currentTrip) return res.status(404).json({ message: 'Trip not found' });

        const { vehicleId, driverId, cargoWeight, origin, destination, status, plannedDistance, revenue } = req.body;

        // Perform updates in a transaction
        const updated = await prisma.$transaction(async (tx) => {
            // Release old vehicle
            if (vehicleId && vehicleId !== currentTrip.vehicleId) {
                await tx.vehicle.update({
                    where: { id: currentTrip.vehicleId },
                    data: { status: 'Available' }
                });
                await tx.vehicle.update({
                    where: { id: vehicleId },
                    data: { status: 'On_Trip' }
                });
            }

            // Release old driver
            if (driverId && driverId !== currentTrip.driverId) {
                await tx.driver.update({
                    where: { id: currentTrip.driverId },
                    data: { status: 'Available' }
                });
                await tx.driver.update({
                    where: { id: driverId },
                    data: { status: 'On_Trip' }
                });
            }

            // Handle cancellation penalty
            if (status === 'Cancelled' && currentTrip.status !== 'Cancelled') {
                const driver = await tx.driver.findUnique({ where: { id: currentTrip.driverId } });
                if (driver) {
                    await tx.driver.update({
                        where: { id: currentTrip.driverId },
                        data: {
                            status: 'Available',
                            safetyScore: Math.max(0, driver.safetyScore - 5)
                        }
                    });
                }
                await tx.vehicle.update({
                    where: { id: currentTrip.vehicleId },
                    data: { status: 'Available' }
                });
            }

            const data = {};
            if (vehicleId) data.vehicleId = vehicleId;
            if (driverId) data.driverId = driverId;
            if (cargoWeight) data.cargoWeight = Number(cargoWeight);
            if (origin) data.origin = origin;
            if (destination) data.destination = destination;
            if (status) data.status = status;
            if (plannedDistance) data.plannedDistance = Number(plannedDistance);
            if (revenue !== undefined) data.revenue = Number(revenue);

            return await tx.trip.update({
                where: { id },
                data,
                include: { vehicle: true, driver: true }
            });
        });

        res.json(toDisplayTrip(updated));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const deleteTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await prisma.trip.findUnique({ where: { id } });
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        await prisma.$transaction(async (tx) => {
            if (trip.status === 'Dispatched') {
                await tx.vehicle.update({
                    where: { id: trip.vehicleId },
                    data: { status: 'Available' }
                });
                await tx.driver.update({
                    where: { id: trip.driverId },
                    data: { status: 'Available' }
                });
            }
            await tx.trip.delete({ where: { id } });
        });

        res.json({ message: 'Trip removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
