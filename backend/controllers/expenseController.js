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

        const log = await prisma.expenseLog.create({
            data: {
                tripId: tripId || null,
                vehicleId,
                liters: Number(liters),
                cost: Number(cost),
                date: date ? new Date(date) : new Date()
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

        if (data.liters) data.liters = Number(data.liters);
        if (data.cost) data.cost = Number(data.cost);
        if (data.date) data.date = new Date(data.date);
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
