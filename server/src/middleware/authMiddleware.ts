import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/constants';
import User from '../models/User';
import { AuthRequest, IUser } from '../types';

interface JwtPayload {
    id: string;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        // Check for token in cookie first, then Authorization header
        if (req.cookies?.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
            return;
        }

        try {
            const decoded = jwt.verify(token, config.jwtSecret!) as JwtPayload;
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }

            req.user = user as IUser;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
            return;
        }
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            });
            return;
        }

        next();
    };
};
