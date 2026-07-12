import express from 'express';
import { getExpenseLogs, createExpenseLog, updateExpenseLog, deleteExpenseLog } from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(authorize('Manager', 'Financial Analyst'), getExpenseLogs)
    .post(authorize('Manager', 'Driver', 'Financial Analyst'), createExpenseLog);

router.route('/:id')
    .put(authorize('Manager', 'Financial Analyst'), updateExpenseLog)
    .delete(authorize('Manager', 'Financial Analyst'), deleteExpenseLog);

export default router;
