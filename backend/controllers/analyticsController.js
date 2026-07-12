import { prisma } from '../config/db.js';

export const getDashboardStats = async (req, res) => {
    try {
        const totalVehicles = await prisma.vehicle.count();
        const activeVehicles = await prisma.vehicle.count({ where: { status: 'On_Trip' } });
        const inShopVehicles = await prisma.vehicle.count({ where: { status: 'In_Shop' } });
        const pendingTrips = await prisma.trip.count({ where: { status: 'Draft' } });

        // Calculate trips data for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trips = await prisma.trip.findMany({
            where: { createdAt: { gte: sevenDaysAgo } }
        });

        // Group trips by date (YYYY-MM-DD)
        const dailyTripsMap = {};
        trips.forEach(trip => {
            const dateStr = trip.createdAt.toISOString().split('T')[0];
            if (!dailyTripsMap[dateStr]) {
                dailyTripsMap[dateStr] = { completed: 0, cancelled: 0 };
            }
            if (trip.status === 'Completed') {
                dailyTripsMap[dateStr].completed += 1;
            } else if (trip.status === 'Cancelled') {
                dailyTripsMap[dateStr].cancelled += 1;
            }
        });

        const tripsData = Object.keys(dailyTripsMap).sort().map(date => ({
            name: date,
            completed: dailyTripsMap[date].completed,
            cancelled: dailyTripsMap[date].cancelled
        }));

        res.json({
            totalVehicles,
            activeVehicles,
            inShopVehicles,
            pendingTrips,
            utilizationRate: totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(2) : 0,
            tripsData,
            healthData: [
                { name: 'Current', active: activeVehicles, inShop: inShopVehicles }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const getFinancialReports = async (req, res) => {
    try {
        const expenses = await prisma.expenseLog.findMany();
        const maintenance = await prisma.maintenanceLog.findMany();
        const vehicles = await prisma.vehicle.findMany();
        const trips = await prisma.trip.findMany();

        const totalRevenue = trips.reduce((acc, trip) => acc + (trip.revenue || 0), 0);
        const totalFuelCost = expenses.reduce((acc, exp) => acc + exp.cost, 0);
        const totalLiters = expenses.reduce((acc, exp) => acc + (exp.liters || 0), 0);
        const totalMaintenanceCost = maintenance.reduce((acc, log) => acc + log.cost, 0);

        // Estimate total fleet distance from current odometers
        const totalDistance = vehicles.reduce((acc, v) => acc + (v.odometer || 0), 0);
        const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : 0;
        const totalAcquisitionCost = vehicles.reduce((acc, v) => acc + (v.acquisitionCost || 0), 0);
        const costPerKm = totalDistance > 0 ? (totalFuelCost / totalDistance).toFixed(2) : 0;

        // ROI Data: Revenue vs Cost Monthly (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentExpenses = await prisma.expenseLog.findMany({ where: { date: { gte: sixMonthsAgo } } });
        const recentMaintenance = await prisma.maintenanceLog.findMany({ where: { date: { gte: sixMonthsAgo } } });
        const recentTrips = await prisma.trip.findMany({ where: { createdAt: { gte: sixMonthsAgo } } });

        const monthlyData = {};

        recentExpenses.forEach(e => {
            const month = e.date.toISOString().slice(0, 7); // YYYY-MM
            if (!monthlyData[month]) monthlyData[month] = { cost: 0, revenue: 0 };
            monthlyData[month].cost += e.cost;
        });

        recentMaintenance.forEach(m => {
            const month = m.date.toISOString().slice(0, 7);
            if (!monthlyData[month]) monthlyData[month] = { cost: 0, revenue: 0 };
            monthlyData[month].cost += m.cost;
        });

        recentTrips.forEach(t => {
            const month = t.createdAt.toISOString().slice(0, 7);
            if (!monthlyData[month]) monthlyData[month] = { cost: 0, revenue: 0 };
            monthlyData[month].revenue += t.revenue || 0;
        });

        const roiData = Object.keys(monthlyData).sort().map(month => ({
            month,
            cost: monthlyData[month].cost || 0,
            revenue: monthlyData[month].revenue || 0
        }));

        const totalOpsCost = totalFuelCost + totalMaintenanceCost;
        let vehicleRoi = 0;
        if (totalAcquisitionCost > 0) {
            vehicleRoi = parseFloat((((totalRevenue - totalOpsCost) / totalAcquisitionCost) * 100).toFixed(2));
        }

        res.json({
            totalFuelCost,
            totalMaintenanceCost,
            totalOperationalCost: totalOpsCost,
            costPerKm: parseFloat(costPerKm),
            fuelEfficiency: parseFloat(fuelEfficiency),
            avgRoi: vehicleRoi,
            roiData
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
