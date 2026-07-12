import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import tripRoutes from './routes/trips.js';
import maintenanceRoutes from './routes/maintenance.js';
import expenseRoutes from './routes/expenses.js';
import analyticsRoutes from './routes/analytics.js';
import { prisma } from './config/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL and start Server
async function startServer() {
    try {
        await prisma.$connect();
        console.log('Connected to PostgreSQL via Prisma successfully');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT} and listening on all interfaces (0.0.0.0)`);
        });
    } catch (err) {
        console.error('Database connection error during startup:', err);
        process.exit(1);
    }
}

startServer();
