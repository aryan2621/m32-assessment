import { Response } from 'express';
import Expense from '../models/Expense';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { generateAnalytics } from '../agents/analyticsAgent';
import { logger } from '../utils/logger';
import { CreateExpenseDTO, UpdateExpenseDTO, GetExpensesQueryDTO } from '../dto/expense.dto';

export const getAnalytics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const { startDate, endDate } = req.query;

    let query: any = { userId: req.user._id };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = new Date(startDate as string);
        }
        if (endDate) {
            query.date.$lte = new Date(endDate as string);
        }
    }

    const expenses = await Expense.find(query).lean();

    const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const byCategory: Record<string, number> = {};
    const byVendor: Record<string, number> = {};

    expenses.forEach((exp) => {
        const category = exp.category || 'uncategorized';
        byCategory[category] = (byCategory[category] || 0) + (exp.amount || 0);

        if (exp.vendor) {
            byVendor[exp.vendor] = (byVendor[exp.vendor] || 0) + (exp.amount || 0);
        }
    });

    const topVendors = Object.entries(byVendor)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([vendor, amount]) => ({ vendor, amount }));

    const monthlyTrends: Record<string, number> = {};
    expenses.forEach((exp) => {
        if (exp.date) {
            const month = new Date(exp.date).toISOString().slice(0, 7);
            monthlyTrends[month] = (monthlyTrends[month] || 0) + (exp.amount || 0);
        }
    });

    sendSuccess(
        res,
        {
            totalExpenses: total,
            expenseCount: expenses.length,
            averageExpense: expenses.length > 0 ? total / expenses.length : 0,
            byCategory,
            topVendors,
            monthlyTrends: Object.entries(monthlyTrends).map(([month, amount]) => ({
                month,
                amount,
            })),
        },
        'Analytics retrieved successfully'
    );
});

export const getByCategory = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const expenses = await Expense.find({ userId: req.user._id }).lean();

        const byCategory: Record<string, { total: number; count: number }> = {};

        expenses.forEach((exp) => {
            const category = exp.category || 'uncategorized';
            if (!byCategory[category]) {
                byCategory[category] = { total: 0, count: 0 };
            }
            byCategory[category].total += exp.amount || 0;
            byCategory[category].count += 1;
        });

        sendSuccess(res, byCategory, 'Expenses by category retrieved successfully');
    }
);

export const getByVendor = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const expenses = await Expense.find({ userId: req.user._id }).lean();

    const byVendor: Record<string, { total: number; count: number }> = {};

    expenses.forEach((exp) => {
        const vendor = exp.vendor || 'Unknown';
        if (!byVendor[vendor]) {
            byVendor[vendor] = { total: 0, count: 0 };
        }
        byVendor[vendor].total += exp.amount || 0;
        byVendor[vendor].count += 1;
    });

    sendSuccess(res, byVendor, 'Expenses by vendor retrieved successfully');
});

export const getTrends = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const { period = 'monthly' } = req.query;

    const expenses = await Expense.find({ userId: req.user._id }).lean();

    const trends: Record<string, number> = {};

    expenses.forEach((exp) => {
        if (exp.date) {
            const date = new Date(exp.date);
            let key: string;

            if (period === 'yearly') {
                key = date.getFullYear().toString();
            } else {
                key = date.toISOString().slice(0, 7);
            }

            trends[key] = (trends[key] || 0) + (exp.amount || 0);
        }
    });

    sendSuccess(
        res,
        {
            period,
            trends: Object.entries(trends).map(([period, amount]) => ({
                period,
                amount,
            })),
        },
        'Trends retrieved successfully'
    );
});

export const generateReport = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const analytics = await generateAnalytics(
            'Generate expense report',
            req.user._id.toString()
        );

        sendSuccess(
            res,
            {
                report: analytics,
                generatedAt: new Date(),
            },
            'Report generated successfully'
        );
    }
);

export const exportCSV = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const { startDate, endDate } = req.query;

    let query: any = { userId: req.user._id };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = new Date(startDate as string);
        }
        if (endDate) {
            query.date.$lte = new Date(endDate as string);
        }
    }

    const expenses = await Expense.find(query).sort({ date: -1 }).lean();

    const csvHeader = 'Date,Amount,Currency,Category,Vendor,Description\n';
    const csvRows = expenses
        .map((exp) => {
            const date = exp.date ? new Date(exp.date).toISOString().split('T')[0] : '';
            const amount = exp.amount || 0;
            const currency = exp.currency || 'INR';
            const category = exp.category || '';
            const vendor = String(exp.vendor || '').replace(/,/g, ';');
            const description = String(exp.description || '').replace(/,/g, ';');
            return `${date},${amount},${currency},${category},${vendor},${description}`;
        })
        .join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
});

export const getExpenses = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const dto = GetExpensesQueryDTO.validate(req.query, res);
    if (!dto) return;

    const { category, vendor, search, startDate, endDate, page = '1', limit = '20' } = dto;

    const query: any = { userId: req.user._id };

    if (category) {
        query.category = category;
    }

    if (vendor) {
        query.vendor = { $regex: vendor, $options: 'i' };
    }

    if (search) {
        query.$or = [
            { vendor: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = new Date(startDate as string);
        }
        if (endDate) {
            query.date.$lte = new Date(endDate as string);
        }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const expenses = await Expense.find(query).sort({ date: -1 }).skip(skip).limit(limitNum).lean();

    const total = await Expense.countDocuments(query);

    const transformedExpenses = expenses.map((expense: any) => {
        const transformed = { ...expense };
        transformed.id = transformed._id.toString();
        transformed.date = transformed.date ? new Date(transformed.date).toISOString() : null;
        delete transformed._id;
        delete transformed.__v;
        return transformed;
    });

    sendSuccess(
        res,
        {
            expenses: transformedExpenses,
            page: pageNum,
            limit: limitNum,
            total,
        },
        'Expenses retrieved successfully'
    );
});

export const getExpenseById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const expense = await Expense.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!expense) {
            sendError(res, 'Expense not found', 404);
            return;
        }

        const expenseObj = expense.toObject();
        const transformedExpense: any = {
            ...expenseObj,
            id: expenseObj._id.toString(),
            date: expenseObj.date ? new Date(expenseObj.date).toISOString() : null,
        };
        delete transformedExpense._id;
        delete transformedExpense.__v;

        sendSuccess(res, transformedExpense, 'Expense retrieved successfully');
    }
);

export const createExpense = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const dto = CreateExpenseDTO.validate(req.body, res);
        if (!dto) return;

        const { amount, currency, category, vendor, description, date, invoiceId } = dto;

        const expense = await Expense.create({
            userId: req.user._id,
            amount,
            currency: currency || 'INR',
            category,
            vendor,
            description,
            date: new Date(date),
            invoiceId,
        });

        logger.success('Expense created', { expenseId: expense._id });

        const expenseObj = expense.toObject();
        const transformedExpense: any = {
            ...expenseObj,
            id: expenseObj._id.toString(),
            date: expenseObj.date ? new Date(expenseObj.date).toISOString() : null,
        };
        delete transformedExpense._id;
        delete transformedExpense.__v;

        sendSuccess(res, transformedExpense, 'Expense created successfully', 201);
    }
);

export const updateExpense = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const expense = await Expense.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!expense) {
            sendError(res, 'Expense not found', 404);
            return;
        }

        const dto = UpdateExpenseDTO.validate(req.body, res);
        if (!dto) return;

        const { amount, currency, category, vendor, description, date } = dto;

        if (date) {
            expense.date = new Date(date);
        }
        if (amount !== undefined) {
            expense.amount = amount;
        }
        if (currency) {
            expense.currency = currency;
        }
        if (category) {
            expense.category = category;
        }
        if (vendor !== undefined) {
            expense.vendor = vendor;
        }
        if (description !== undefined) {
            expense.description = description;
        }

        await expense.save();

        logger.success('Expense updated', { expenseId: expense._id });

        const expenseObj = expense.toObject();
        const transformedExpense: any = {
            ...expenseObj,
            id: expenseObj._id.toString(),
            date: expenseObj.date ? new Date(expenseObj.date).toISOString() : null,
        };
        delete transformedExpense._id;
        delete transformedExpense.__v;

        sendSuccess(res, transformedExpense, 'Expense updated successfully');
    }
);

export const deleteExpense = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const expense = await Expense.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!expense) {
            sendError(res, 'Expense not found', 404);
            return;
        }

        await Expense.findByIdAndDelete(req.params.id);

        logger.success('Expense deleted', { expenseId: req.params.id });

        sendSuccess(res, null, 'Expense deleted successfully');
    }
);
