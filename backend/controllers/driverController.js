import { prisma } from '../config/db.js';

// Normalization helpers
const toPrismaCategory = (cat) => cat ? cat.replace(' ', '_') : undefined;
const toPrismaStatus = (stat) => stat ? stat.replace(' ', '_') : undefined;

const toDisplayDriver = (d) => {
    if (!d) return null;
    return {
        ...d,
        licenseCategory: d.licenseCategory.replace('_', ' '),
        status: d.status.replace('_', ' ')
    };
};

export const getDrivers = async (req, res) => {
    try {
        const drivers = await prisma.driver.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(drivers.map(toDisplayDriver));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const createDriver = async (req, res) => {
    try {
        const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, status } = req.body;
        const driver = await prisma.driver.create({
            data: {
                name,
                licenseNumber,
                licenseCategory: toPrismaCategory(licenseCategory),
                licenseExpiryDate: new Date(licenseExpiryDate),
                contactNumber: contactNumber || '',
                status: toPrismaStatus(status) || 'Available'
            }
        });
        res.status(201).json(toDisplayDriver(driver));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };

        // Normalize values
        if (data.licenseCategory) data.licenseCategory = toPrismaCategory(data.licenseCategory);
        if (data.status) data.status = toPrismaStatus(data.status);
        if (data.licenseExpiryDate) data.licenseExpiryDate = new Date(data.licenseExpiryDate);
        if (data.safetyScore) data.safetyScore = Number(data.safetyScore);
        if (data.totalTrips) data.totalTrips = Number(data.totalTrips);
        if (data.completedTrips) data.completedTrips = Number(data.completedTrips);
        if (data.performanceScore) data.performanceScore = Number(data.performanceScore);

        const driver = await prisma.driver.update({
            where: { id },
            data
        });
        res.json(toDisplayDriver(driver));
    } catch (error) {
        res.status(400).json({ message: 'Bad Request', error: error.message });
    }
};

export const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.driver.delete({
            where: { id }
        });
        res.json({ message: 'Driver removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
