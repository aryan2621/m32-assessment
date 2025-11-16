import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/constants';
import { logger } from '../utils/logger';
import Settings, { IGoogleDriveIntegration } from '../models/Settings';

const oauth2Client = new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    `${config.backendUrl}/api/settings/google-drive/callback`
);

export const getAuthUrl = (userId: string): string => {
    const scopes = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: userId,
    });

    return url;
};

export const handleCallback = async (
    code: string,
    userId: string
): Promise<IGoogleDriveIntegration> => {
    try {
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        let folderId: string | undefined;
        const folderName = 'expenses';

        try {
            const folderList = await drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
            });

            if (folderList.data.files && folderList.data.files.length > 0) {
                folderId = folderList.data.files[0].id || undefined;
            } else {
                const folder = await drive.files.create({
                    requestBody: {
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder',
                    },
                    fields: 'id',
                });
                folderId = folder.data.id || undefined;
            }
        } catch (error: any) {
            logger.error('Error creating/finding folder', {
                error: error.message,
                userId,
            });
            throw new Error('Failed to create or find expenses folder');
        }

        const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

        const integration: IGoogleDriveIntegration = {
            accessToken: tokens.access_token || '',
            refreshToken: tokens.refresh_token || '',
            tokenExpiry,
            folderId,
            folderName,
            isConnected: true,
            connectedAt: new Date(),
        };

        await Settings.findOneAndUpdate(
            { userId },
            {
                $set: {
                    googleDrive: integration,
                },
            },
            { upsert: true, new: true }
        );

        return integration;
    } catch (error: any) {
        logger.error('Error handling Google Drive callback', {
            error: error.message,
            stack: error.stack,
            userId,
        });
        throw error;
    }
};

export const disconnectGoogleDrive = async (userId: string): Promise<void> => {
    try {
        await Settings.findOneAndUpdate(
            { userId },
            {
                $unset: { googleDrive: 1 },
            }
        );
    } catch (error: any) {
        logger.error('Error disconnecting Google Drive', {
            error: error.message,
            userId,
        });
        throw error;
    }
};
