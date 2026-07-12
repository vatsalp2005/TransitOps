import express from 'express';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All vehicle routes require authentication

router.route('/')
    .get(getVehicles)
    .post(authorize('Manager'), createVehicle);

router.route('/:id')
    .put(authorize('Manager', 'Driver'), updateVehicle)
    .delete(authorize('Manager'), deleteVehicle);

export default router;
