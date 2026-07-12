import express from 'express';
import { getDashboardStats, getFinancialReports } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', authorize('Manager', 'Driver', 'Financial Analyst'), getDashboardStats);
router.get('/financials', authorize('Manager', 'Financial Analyst'), getFinancialReports);

export default router;
