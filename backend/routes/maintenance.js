import express from 'express';
import { getMaintenanceLogs, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog, completeMaintenanceLog } from '../controllers/maintenanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(authorize('Manager', 'Driver', 'Financial Analyst'), getMaintenanceLogs)
    .post(authorize('Manager', 'Driver'), createMaintenanceLog);

router.route('/:id')
    .put(authorize('Manager', 'Driver'), updateMaintenanceLog)
    .delete(authorize('Manager', 'Driver'), deleteMaintenanceLog);

router.post('/:id/complete', authorize('Manager', 'Driver'), completeMaintenanceLog);

export default router;
