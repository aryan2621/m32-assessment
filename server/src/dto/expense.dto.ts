import Joi from 'joi';
import { sendError } from '../utils/apiResponse';
import { Response } from 'express';

export class CreateExpenseDTO {
    amount!: number;
    currency?: string;
    category!: string;
    vendor?: string;
    description?: string;
    date!: string;
    invoiceId?: string;

    private static schema = Joi.object({
        amount: Joi.number().positive().required().messages({
            'number.positive': 'Amount must be a positive number',
            'any.required': 'Amount is required',
        }),
        currency: Joi.string().optional().default('INR'),
        category: Joi.string().required().messages({
            'any.required': 'Category is required',
        }),
        vendor: Joi.string().optional(),
        description: Joi.string().optional(),
        date: Joi.date().iso().required().messages({
            'date.base': 'Date must be a valid date',
            'any.required': 'Date is required',
        }),
        invoiceId: Joi.string().optional(),
    });

    static validate(data: any, res: Response): CreateExpenseDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as CreateExpenseDTO;
    }
}

export class UpdateExpenseDTO {
    amount?: number;
    currency?: string;
    category?: string;
    vendor?: string;
    description?: string;
    date?: string;

    private static schema = Joi.object({
        amount: Joi.number().positive().optional().messages({
            'number.positive': 'Amount must be a positive number',
        }),
        currency: Joi.string().optional(),
        category: Joi.string().optional(),
        vendor: Joi.string().allow(null, '').optional(),
        description: Joi.string().allow(null, '').optional(),
        date: Joi.date().iso().optional().messages({
            'date.base': 'Date must be a valid date',
        }),
    });

    static validate(data: any, res: Response): UpdateExpenseDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as UpdateExpenseDTO;
    }
}

export class GetExpensesQueryDTO {
    category?: string;
    vendor?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;

    private static schema = Joi.object({
        category: Joi.string().optional(),
        vendor: Joi.string().optional(),
        search: Joi.string().optional(),
        startDate: Joi.date().iso().optional().messages({
            'date.base': 'Start date must be a valid date',
        }),
        endDate: Joi.date().iso().optional().messages({
            'date.base': 'End date must be a valid date',
        }),
        page: Joi.string().pattern(/^\d+$/).optional().default('1'),
        limit: Joi.string().pattern(/^\d+$/).optional().default('20'),
    });

    static validate(data: any, res: Response): GetExpensesQueryDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as GetExpensesQueryDTO;
    }
}
