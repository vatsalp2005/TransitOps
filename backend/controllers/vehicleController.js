import { prisma } from '../config/db.js';

// Normalization helpers
const toPrismaCategory = (cat) => cat ? cat.replace(' ', '_') : undefined;
const toPrismaStatus = (stat) => stat ? stat.replace(' ', '_') : undefined;

const toDisplayVehicle = (v) => {
    if (!v) return null;
    return {
        ...v,
        category: v.category.replace('_', ' '),
        status: v.status.replace('_', ' ')
    };
};

export const getVehicles = async (req, res) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(vehicles.map(toDisplayVehicle));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const createVehicle = async (req, res) => {
    try {
        const { name, model, licensePlate, maxCapacity, odometer, category, acquisitionCost } = req.body;
        const vehicle = await prisma.vehicle.create({
            data: {
                name,
                model,
                licensePlate,
                maxCapacity: maxCapacity ? Number(maxCapacity) : 0,
                odometer: odometer ? Number(odometer) : 0,
                category: toPrismaCategory(category),
                acquisitionCost: acquisitionCost ? Number(acquisitionCost) : 0,
                status: 'Available'
            }
        });
        res.status(201).json(toDisplayVehicle(vehicle));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };

        // Normalize numeric fields and enums
        if (data.maxCapacity) data.maxCapacity = Number(data.maxCapacity);
        if (data.odometer) data.odometer = Number(data.odometer);
        if (data.acquisitionCost) data.acquisitionCost = Number(data.acquisitionCost);
        if (data.category) data.category = toPrismaCategory(data.category);
        if (data.status) data.status = toPrismaStatus(data.status);

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data
        });
        res.json(toDisplayVehicle(vehicle));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.vehicle.delete({
            where: { id }
        });
        res.json({ message: 'Vehicle removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
