import Joi from 'joi';
import { sendError } from '../utils/apiResponse';
import { Response } from 'express';

export class SignupDTO {
    name!: string;
    email!: string;
    password!: string;
    confirmPassword!: string;

    private static schema = Joi.object({
        name: Joi.string().min(2).required().messages({
            'string.min': 'Name must be at least 2 characters long',
            'any.required': 'Name is required',
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email',
            'any.required': 'Email is required',
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'Password is required',
        }),
        confirmPassword: Joi.string().min(6).required().valid(Joi.ref('password')).messages({
            'any.only': 'Passwords do not match',
            'any.required': 'Confirm password is required',
        }),
    });

    static validate(data: any, res: Response): SignupDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as SignupDTO;
    }
}

export class LoginDTO {
    email!: string;
    password!: string;

    private static schema = Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email',
            'any.required': 'Email is required',
        }),
        password: Joi.string().required().messages({
            'any.required': 'Password is required',
        }),
    });

    static validate(data: any, res: Response): LoginDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as LoginDTO;
    }
}

export class UpdateProfileDTO {
    name?: string;
    email?: string;

    private static schema = Joi.object({
        name: Joi.string().min(2).optional().messages({
            'string.min': 'Name must be at least 2 characters long',
        }),
        email: Joi.string().email().optional().messages({
            'string.email': 'Please provide a valid email',
        }),
    });

    static validate(data: any, res: Response): UpdateProfileDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as UpdateProfileDTO;
    }
}

export class ChangePasswordDTO {
    currentPassword!: string;
    newPassword!: string;

    private static schema = Joi.object({
        currentPassword: Joi.string().required().messages({
            'any.required': 'Current password is required',
        }),
        newPassword: Joi.string().min(6).required().messages({
            'string.min': 'New password must be at least 6 characters long',
            'any.required': 'New password is required',
        }),
    });

    static validate(data: any, res: Response): ChangePasswordDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as ChangePasswordDTO;
    }
}
