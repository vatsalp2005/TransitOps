import express from 'express';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../controllers/driverController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(authorize('Manager', 'Safety Officer', 'Driver'), getDrivers)
    .post(authorize('Manager', 'Safety Officer'), createDriver);

router.route('/:id')
    .put(authorize('Manager', 'Safety Officer'), updateDriver)
    .delete(authorize('Manager', 'Safety Officer'), deleteDriver);

export default router;
