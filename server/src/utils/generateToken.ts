import jwt from 'jsonwebtoken';
import { config } from '../config/constants';

export const generateToken = (userId: string): string => {
    if (!config.jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
    }
    const options: jwt.SignOptions = {};
    if (config.jwtExpire) {
        options.expiresIn = config.jwtExpire as unknown as number;
    }
    return jwt.sign({ id: userId }, config.jwtSecret, options);
};
