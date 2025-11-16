import mongoose, { Schema } from 'mongoose';
import { IExpense } from '../types';

const expenseSchema = new Schema<IExpense>(
    {
        userId: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
        },
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: 'Invoice',
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        category: {
            type: String,
            required: true,
        },
        vendor: String,
        description: String,
        date: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ category: 1 });

const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

export default Expense;
