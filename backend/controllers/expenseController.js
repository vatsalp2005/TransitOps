import { prisma } from '../config/db.js';

// Financial Analyst (Harsh-Vipul-Patel): Handles expense tracking and normalization

// Normalization and mapping helper to match Mongoose output format
const toDisplayExpense = (e) => {
    if (!e) return null;
    return {
        _id: e.id,
        id: e.id,
        liters: e.liters,
        cost: e.cost,
        date: e.date,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        vehicleId: e.vehicle ? {
            _id: e.vehicle.id,
            id: e.vehicle.id,
            name: e.vehicle.name,
            model: e.vehicle.model,
            category: e.vehicle.category.replace('_', ' '),
            licensePlate: e.vehicle.licensePlate,
            maxCapacity: e.vehicle.maxCapacity,
            odometer: e.vehicle.odometer,
            status: e.vehicle.status.replace('_', ' ')
        } : null,
        tripId: e.trip ? {
            _id: e.trip.id,
            id: e.trip.id,
            origin: e.trip.origin,
            destination: e.trip.destination,
            cargoWeight: e.trip.cargoWeight,
            plannedDistance: e.trip.plannedDistance,
            revenue: e.trip.revenue,
            status: e.trip.status
        } : null
    };
};

export const getExpenseLogs = async (req, res) => {
    try {
        const logs = await prisma.expenseLog.findMany({
            include: { vehicle: true, trip: true },
            orderBy: { date: 'desc' }
        });
        res.json(logs.map(toDisplayExpense));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const createExpenseLog = async (req, res) => {
    try {
        const { tripId, vehicleId, liters, cost, date } = req.body;

        if (!vehicleId) {
            return res.status(400).json({ message: 'Vehicle ID is required' });
        }

        const numLiters = Number(liters);
        const numCost = Number(cost);

        if (isNaN(numLiters) || numLiters <= 0) {
            return res.status(400).json({ message: 'Liters must be a valid positive number' });
        }

        if (isNaN(numCost) || numCost <= 0) {
            return res.status(400).json({ message: 'Cost must be a valid positive number' });
        }

        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const logDate = date ? new Date(date) : new Date();
        if (isNaN(logDate.getTime()) || logDate > new Date()) {
            return res.status(400).json({ message: 'Invalid or future date provided' });
        }

        const log = await prisma.expenseLog.create({
            data: {
                tripId: tripId || null,
                vehicleId,
                liters: numLiters,
                cost: numCost,
                date: logDate
            },
            include: { vehicle: true, trip: true }
        });

        res.status(201).json(toDisplayExpense(log));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const updateExpenseLog = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };

        if (data.liters !== undefined) {
            const numLiters = Number(data.liters);
            if (isNaN(numLiters) || numLiters <= 0) {
                return res.status(400).json({ message: 'Liters must be a valid positive number' });
            }
            data.liters = numLiters;
        }

        if (data.cost !== undefined) {
            const numCost = Number(data.cost);
            if (isNaN(numCost) || numCost <= 0) {
                return res.status(400).json({ message: 'Cost must be a valid positive number' });
            }
            data.cost = numCost;
        }

        if (data.date !== undefined) {
            const logDate = new Date(data.date);
            if (isNaN(logDate.getTime()) || logDate > new Date()) {
                return res.status(400).json({ message: 'Invalid or future date provided' });
            }
            data.date = logDate;
        }
        if (data.tripId === '') data.tripId = null;

        const log = await prisma.expenseLog.update({
            where: { id },
            data,
            include: { vehicle: true, trip: true }
        });
        res.json(toDisplayExpense(log));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const deleteExpenseLog = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.expenseLog.delete({
            where: { id }
        });
        res.json({ message: 'Log removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
