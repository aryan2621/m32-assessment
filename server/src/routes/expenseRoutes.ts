import express from 'express';
import {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getAnalytics,
    getByCategory,
    getByVendor,
    getTrends,
    generateReport,
    exportCSV,
} from '../controllers/expenseController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getExpenses);
router.get('/analytics', protect, getAnalytics);
router.get('/by-category', protect, getByCategory);
router.get('/by-vendor', protect, getByVendor);
router.get('/trends', protect, getTrends);
router.post('/report', protect, generateReport);
router.get('/export', protect, exportCSV);
router.get('/:id', protect, getExpenseById);
router.post('/', protect, createExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

export default router;
