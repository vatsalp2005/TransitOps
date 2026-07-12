import { prisma } from '../config/db.js';

// Normalization and mapping helper to match Mongoose output format
const toDisplayLog = (l) => {
    if (!l) return null;
    return {
        _id: l.id,
        id: l.id,
        description: l.description,
        cost: l.cost,
        date: l.date,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        vehicleId: l.vehicle ? {
            _id: l.vehicle.id,
            id: l.vehicle.id,
            name: l.vehicle.name,
            model: l.vehicle.model,
            category: l.vehicle.category.replace('_', ' '),
            licensePlate: l.vehicle.licensePlate,
            maxCapacity: l.vehicle.maxCapacity,
            odometer: l.vehicle.odometer,
            status: l.vehicle.status.replace('_', ' ')
        } : null
    };
};

export const getMaintenanceLogs = async (req, res) => {
    try {
        const logs = await prisma.maintenanceLog.findMany({
            include: { vehicle: true },
            orderBy: { date: 'desc' }
        });
        res.json(logs.map(toDisplayLog));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const createMaintenanceLog = async (req, res) => {
    try {
        const { vehicleId, description, cost, date } = req.body;

        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

        const log = await prisma.$transaction(async (tx) => {
            const newLog = await tx.maintenanceLog.create({
                data: {
                    vehicleId,
                    description,
                    cost: Number(cost),
                    date: date ? new Date(date) : new Date()
                },
                include: { vehicle: true }
            });

            await tx.vehicle.update({
                where: { id: vehicleId },
                data: { status: 'In_Shop' }
            });

            return newLog;
        });

        res.status(201).json(toDisplayLog(log));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const updateMaintenanceLog = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };

        if (data.cost) data.cost = Number(data.cost);
        if (data.date) data.date = new Date(data.date);

        const log = await prisma.maintenanceLog.update({
            where: { id },
            data,
            include: { vehicle: true }
        });
        res.json(toDisplayLog(log));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const deleteMaintenanceLog = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.maintenanceLog.delete({
            where: { id }
        });
        res.json({ message: 'Log removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const completeMaintenanceLog = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await prisma.maintenanceLog.findUnique({ where: { id } });
        if (!log) return res.status(404).json({ message: 'Maintenance log not found' });

        await prisma.$transaction(async (tx) => {
            const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
            if (vehicle) {
                // Restore to Available unless Retired
                if (vehicle.status !== 'Retired') {
                    await tx.vehicle.update({
                        where: { id: log.vehicleId },
                        data: { status: 'Available' }
                    });
                }
            }

            // Create Expense Log for the completed maintenance cost
            await tx.expenseLog.create({
                data: {
                    vehicleId: log.vehicleId,
                    liters: 0,
                    cost: log.cost,
                    date: new Date()
                }
            });

            // Delete original maintenance log
            await tx.maintenanceLog.delete({ where: { id } });
        });

        res.json({ message: 'Maintenance completed. Vehicle is now Available and Expense logged.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
