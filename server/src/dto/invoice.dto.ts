import Joi from 'joi';
import { sendError } from '../utils/apiResponse';
import { Response } from 'express';

export class UpdateInvoiceDTO {
    vendorName?: string;
    vendorEmail?: string;
    vendorPhone?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    totalAmount?: number;
    currency?: string;
    taxAmount?: number;
    subtotal?: number;
    category?: 'utilities' | 'software' | 'office' | 'marketing' | 'other';
    status?: 'pending' | 'paid' | 'overdue';
    paymentMethod?: string;
    notes?: string;

    private static schema = Joi.object({
        vendorName: Joi.string().optional(),
        vendorEmail: Joi.string().email().optional().messages({
            'string.email': 'Please provide a valid email',
        }),
        vendorPhone: Joi.string().optional(),
        invoiceNumber: Joi.string().optional(),
        invoiceDate: Joi.date().iso().optional().messages({
            'date.base': 'Invoice date must be a valid date',
        }),
        dueDate: Joi.date().iso().optional().messages({
            'date.base': 'Due date must be a valid date',
        }),
        totalAmount: Joi.number().positive().optional().messages({
            'number.positive': 'Total amount must be a positive number',
        }),
        currency: Joi.string().optional(),
        taxAmount: Joi.number().optional(),
        subtotal: Joi.number().optional(),
        category: Joi.string()
            .valid('utilities', 'software', 'office', 'marketing', 'other')
            .optional(),
        status: Joi.string().valid('pending', 'paid', 'overdue').optional(),
        paymentMethod: Joi.string().optional(),
        notes: Joi.string().optional(),
    });

    static validate(data: any, res: Response): UpdateInvoiceDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as UpdateInvoiceDTO;
    }
}
