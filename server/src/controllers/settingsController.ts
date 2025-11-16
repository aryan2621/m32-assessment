import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { getAuthUrl, handleCallback, disconnectGoogleDrive } from '../services/googleDriveService';
import { syncAllInvoicesToDrive } from '../agents/driveSyncAgent';
import Settings from '../models/Settings';
import { logger } from '../utils/logger';
import { config } from '../config/constants';

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
        sendSuccess(
            res,
            {
                googleDrive: {
                    isConnected: false,
                },
            },
            'Settings retrieved'
        );
        return;
    }

    const response = {
        googleDrive: {
            isConnected: settings.googleDrive?.isConnected || false,
            folderName: settings.googleDrive?.folderName || 'expenses',
            connectedAt: settings.googleDrive?.connectedAt,
        },
    };

    sendSuccess(res, response, 'Settings retrieved');
});

export const initiateGoogleDriveAuth = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const authUrl = getAuthUrl(req.user._id.toString());
        sendSuccess(res, { authUrl }, 'Auth URL generated');
    }
);

export const handleGoogleDriveCallback = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const { code, state } = req.query;

        if (!code || !state) {
            sendError(res, 'Missing code or state parameter', 400);
            return;
        }
        const clientUrl =
            config.nodeEnv === 'development' ? 'http://localhost:5173' : config.clientUrl!;
        try {
            const userId = state as string;
            await handleCallback(code as string, userId);
            res.redirect(`${clientUrl}/settings?connected=true`);
        } catch (error: any) {
            logger.error('Error in Google Drive callback', {
                error: error.message,
            });
            res.redirect(`${clientUrl}/settings?error=connection_failed`);
        }
    }
);

export const disconnectDrive = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        await disconnectGoogleDrive(req.user._id.toString());
        sendSuccess(res, null, 'Google Drive disconnected successfully');
    }
);

export const syncAllInvoicesSSE = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const origin = req.headers.origin;
        const allowedOrigin =
            origin ||
            (config.nodeEnv === 'development' ? 'http://localhost:5173' : config.clientUrl!);

        const corsHeaders = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Credentials': 'true',
        };

        if (!req.user) {
            res.writeHead(400, corsHeaders);
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'User not found' })}\n\n`);
            res.end();
            return;
        }

        const settings = await Settings.findOne({ userId: req.user._id });
        if (!settings?.googleDrive?.isConnected) {
            res.writeHead(400, corsHeaders);
            res.write(
                `data: ${JSON.stringify({ type: 'error', message: 'Google Drive is not connected' })}\n\n`
            );
            res.end();
            return;
        }

        res.writeHead(200, corsHeaders);

        const sendEvent = (event: {
            type: string;
            message: string;
            progress?: number;
            data?: any;
        }) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        };

        try {
            const progressCallback = (event: {
                type: string;
                message: string;
                progress?: number;
                data?: any;
            }) => {
                sendEvent(event);
            };

            await syncAllInvoicesToDrive(req.user._id.toString(), progressCallback);

            sendEvent({
                type: 'success',
                message: 'All invoices synced to Google Drive successfully',
                progress: 100,
            });

            res.end();
        } catch (error: any) {
            logger.error('Sync SSE error', {
                error: error.message,
                stack: error.stack,
                userId: req.user._id.toString(),
            });

            sendEvent({
                type: 'error',
                message: error.message || 'An unexpected error occurred',
            });

            res.end();
        }
    }
);
