import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MulterError } from 'multer';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

interface CustomError extends Error {
    statusCode?: number;
    code?: number;
    keyValue?: Record<string, any>;
    errors?: Record<string, any>;
}

export const errorHandler = (
    err: CustomError | MulterError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let error = { ...err };
    error.message = err.message;

    let statusCode = (err as CustomError).statusCode || 500;
    let message = err.message || 'Server Error';

    logger.error('Error occurred in request', {
        path: req.path,
        method: req.method,
        statusCode,
        message: err.message,
        errorName: err.name,
        errorCode: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        body: req.body,
        query: req.query,
        params: req.params,
    });

    if (err instanceof MongooseError.CastError) {
        message = 'Resource not found';
        statusCode = 404;
    }

    if (err instanceof MongooseError.ValidationError) {
        const errors = Object.values(err.errors).map((e) => e.message);
        message = errors.join(', ');
        statusCode = 400;
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        message = `${field} already exists`;
        statusCode = 400;
    }

    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        message = 'Token expired';
        statusCode = 401;
    }

    if (err instanceof MulterError) {
        const multerErr = err as MulterError;
        if (multerErr.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large. Maximum size is 10MB';
            statusCode = 400;
        } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
            statusCode = 400;
        } else {
            message = multerErr.message;
            statusCode = 400;
        }
    }

    const response: ApiResponse = {
        success: false,
        message,
    };

    if (process.env.NODE_ENV === 'development') {
        response.data = {
            stack: err.stack,
            error: err,
        };
    }

    res.status(statusCode).json(response);
};
