import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body);

        if (error) {
            res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
            return;
        }

        next();
    };
};

export const signupSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().min(6).required().valid(Joi.ref('password')),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).optional(),
    email: Joi.string().email().optional(),
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
});

export const updateInvoiceSchema = Joi.object({
    vendorName: Joi.string().optional(),
    vendorEmail: Joi.string().email().optional(),
    vendorPhone: Joi.string().optional(),
    invoiceNumber: Joi.string().optional(),
    invoiceDate: Joi.date().optional(),
    dueDate: Joi.date().optional(),
    totalAmount: Joi.number().optional(),
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

export const createSessionSchema = Joi.object({
    title: Joi.string().optional(),
});

export const sendMessageSchema = Joi.object({
    sessionId: Joi.string().optional(),
    message: Joi.string().optional(),
    content: Joi.string().optional(),
    fileId: Joi.string().optional(),
}).or('message', 'content');
