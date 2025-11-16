import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
): void => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
    };
    res.status(statusCode).json(response);
};

export const sendError = (
    res: Response,
    message: string = 'Error',
    statusCode: number = 500
): void => {
    const response: ApiResponse = {
        success: false,
        message,
    };
    res.status(statusCode).json(response);
};
