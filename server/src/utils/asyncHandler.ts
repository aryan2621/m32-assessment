import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { AuthRequest } from '../types';

type AsyncFunction<T extends Request = Request> = (
    req: T,
    res: Response,
    next?: NextFunction
) => Promise<any>;

export const asyncHandler = <T extends Request = Request>(fn: AsyncFunction<T>) => {
    return (req: T | AuthRequest, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req as T, res, next)).catch((error) => {
            logger.error('[ASYNC_HANDLER] Unhandled promise rejection', {
                path: req.path,
                method: req.method,
                error: error.message,
                stack: error.stack,
                errorName: error.name,
                errorCode: error.code,
            });
            next(error);
        });
    };
};
