import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { generateToken } from '../utils/generateToken';
import { logger } from '../utils/logger';
import { SignupDTO, LoginDTO, UpdateProfileDTO, ChangePasswordDTO } from '../dto/auth.dto';
import { config } from '../config/constants';

export const signup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const dto = SignupDTO.validate(req.body, res);
    if (!dto) return;

    const { name, email, password } = dto;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            sendError(res, 'User already exists with this email', 400);
            return;
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        const token = generateToken(user._id.toString());

        const isProduction = process.env.NODE_ENV === 'production';
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        sendSuccess(
            res,
            {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            'User registered successfully',
            201
        );
    } catch (error: any) {
        logger.error('[SIGNUP] Error during signup', {
            error: error.message,
            stack: error.stack,
            email,
            name,
            errorName: error.name,
            errorCode: error.code,
        });
        throw error;
    }
});

export const login = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const dto = LoginDTO.validate(req.body, res);
    if (!dto) return;

    const { email, password } = dto;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        sendError(res, 'Invalid credentials', 401);
        return;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        sendError(res, 'Invalid credentials', 401);
        return;
    }

    const token = generateToken(user._id.toString());

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });

    sendSuccess(
        res,
        {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        },
        'Login successful'
    );
});

export const updateProfile = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const dto = UpdateProfileDTO.validate(req.body, res);
        if (!dto) return;

        const { name, email } = dto;

        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                sendError(res, 'Email already in use', 400);
                return;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name, email },
            { new: true, runValidators: true }
        );

        sendSuccess(
            res,
            {
                id: updatedUser?._id,
                name: updatedUser?.name,
                email: updatedUser?.email,
                role: updatedUser?.role,
            },
            'Profile updated successfully'
        );
    }
);

export const changePassword = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        if (req.user.googleId && !req.user.password) {
            sendError(
                res,
                'Cannot change password for Google OAuth accounts. Please set a password first.',
                400
            );
            return;
        }

        const dto = ChangePasswordDTO.validate(req.body, res);
        if (!dto) return;

        const { currentPassword, newPassword } = dto;

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            sendError(res, 'User not found', 404);
            return;
        }

        if (!user.password) {
            sendError(res, 'No password set for this account', 400);
            return;
        }

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            sendError(res, 'Current password is incorrect', 400);
            return;
        }

        user.password = newPassword;
        await user.save();

        sendSuccess(res, null, 'Password changed successfully');
    }
);

export const logout = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
    });

    sendSuccess(res, null, 'Logged out successfully');
});

export const googleAuthCallback = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user as any;

        if (!user) {
            logger.error('[GOOGLE_OAUTH] No user found in request after OAuth callback');
            res.redirect(
                `${config.clientUrl!}/login?error=authentication_failed`
            );
            return;
        }

        const token = generateToken(user._id.toString());

        logger.info('[GOOGLE_OAUTH] User authenticated successfully', {
            userId: user._id,
            email: user.email,
        });

        // Prepare user data to send to frontend
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        // Encode user data as base64 to pass in URL safely
        const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');

        // Redirect to frontend with token and user data in URL
        res.redirect(
            `${config.clientUrl!}/auth/google/callback?token=${token}&user=${userDataEncoded}`
        );
    }
);
