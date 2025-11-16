import { Response } from 'express';
import Invoice from '../models/Invoice';
import Expense from '../models/Expense';
import User from '../models/User';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { UpdateProfileDTO } from '../dto/auth.dto';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    sendSuccess(
        res,
        {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            isEmailVerified: req.user.isEmailVerified,
            createdAt: req.user.createdAt,
        },
        'Profile retrieved successfully'
    );
});

export const updateProfile = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const dto = UpdateProfileDTO.validate(req.body, res);
        if (!dto) return;

        const { name, email } = dto;

        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                sendError(res, 'Email already in use', 400);
                return;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name, email },
            { new: true, runValidators: true }
        );

        sendSuccess(
            res,
            {
                id: updatedUser?._id,
                name: updatedUser?.name,
                email: updatedUser?.email,
                role: updatedUser?.role,
            },
            'Profile updated successfully'
        );
    }
);

export const getStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const totalInvoices = await Invoice.countDocuments({ userId: req.user._id });
    const pendingInvoices = await Invoice.countDocuments({
        userId: req.user._id,
        status: 'pending',
    });
    const paidInvoices = await Invoice.countDocuments({
        userId: req.user._id,
        status: 'paid',
    });

    const expenses = await Expense.find({ userId: req.user._id }).lean();
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthExpenses = expenses
        .filter((exp) => exp.date && new Date(exp.date) >= thisMonth)
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    sendSuccess(
        res,
        {
            totalInvoices,
            pendingInvoices,
            paidInvoices,
            totalExpenses,
            thisMonthExpenses,
            totalExpenseCount: expenses.length,
        },
        'Stats retrieved successfully'
    );
});
