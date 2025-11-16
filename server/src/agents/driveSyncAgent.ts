import Invoice from '../models/Invoice';
import Settings from '../models/Settings';
import { downloadFile } from '../services/supabaseService';
import { logger } from '../utils/logger';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/constants';
import { Readable } from 'stream';

const oauth2Client = new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    `${config.backendUrl}/api/settings/google-drive/callback`
);

const getDriveClient = async (userId: string) => {
    const settings = await Settings.findOne({ userId });

    if (
        !settings?.googleDrive?.isConnected ||
        !settings.googleDrive.accessToken ||
        !settings.googleDrive.refreshToken
    ) {
        throw new Error('Google Drive not connected');
    }

    const { accessToken, refreshToken, tokenExpiry } = settings.googleDrive;

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: tokenExpiry?.getTime(),
    });

    if (tokenExpiry && tokenExpiry <= new Date()) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);

            await Settings.findOneAndUpdate(
                { userId },
                {
                    $set: {
                        'googleDrive.accessToken': credentials.access_token,
                        'googleDrive.tokenExpiry': credentials.expiry_date
                            ? new Date(credentials.expiry_date)
                            : undefined,
                    },
                }
            );
        } catch (error: any) {
            logger.error('Error refreshing token', {
                error: error.message,
                userId,
            });
            throw new Error('Failed to refresh access token');
        }
    }

    return google.drive({ version: 'v3', auth: oauth2Client });
};

const uploadFileToDrive = async (
    userId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
): Promise<string> => {
    try {
        const drive = await getDriveClient(userId);
        const settings = await Settings.findOne({ userId });

        if (!settings?.googleDrive?.folderId) {
            throw new Error('Expenses folder not found');
        }

        const fileMetadata = {
            name: fileName,
            parents: [settings.googleDrive.folderId],
        };

        const stream = Readable.from(fileBuffer);

        const media = {
            mimeType,
            body: stream,
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        return file.data.id || '';
    } catch (error: any) {
        logger.error('Error uploading file to Drive', {
            error: error.message,
            stack: error.stack,
            userId,
            fileName,
        });
        throw error;
    }
};

export const syncInvoiceToDrive = async (userId: string, invoiceId: string): Promise<string> => {
    try {
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            userId,
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const fileBuffer = await downloadFile(invoice.fileUrl);
        const driveFileId = await uploadFileToDrive(
            userId,
            invoice.fileName,
            fileBuffer,
            invoice.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'
        );

        logger.info('Invoice synced to Google Drive', {
            userId,
            invoiceId,
            driveFileId,
        });

        return driveFileId;
    } catch (error: any) {
        logger.error('Error syncing invoice to Drive', {
            error: error.message,
            stack: error.stack,
            userId,
            invoiceId,
        });
        throw error;
    }
};

export type SyncProgressCallback = (event: {
    type: string;
    message: string;
    progress?: number;
    data?: any;
}) => void;

export const syncAllInvoicesToDrive = async (
    userId: string,
    onProgress?: SyncProgressCallback
): Promise<void> => {
    try {
        const invoices = await Invoice.find({ userId });
        const totalInvoices = invoices.length;

        if (totalInvoices === 0) {
            onProgress?.({
                type: 'info',
                message: 'No invoices to sync',
                progress: 100,
            });
            return;
        }

        onProgress?.({
            type: 'sync_start',
            message: `Starting sync of ${totalInvoices} invoices...`,
            progress: 0,
            data: { total: totalInvoices },
        });

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < invoices.length; i++) {
            const invoice = invoices[i];
            const currentProgress = Math.round(((i + 1) / totalInvoices) * 100);

            try {
                onProgress?.({
                    type: 'syncing',
                    message: `Syncing invoice ${i + 1} of ${totalInvoices}: ${invoice.fileName}`,
                    progress: currentProgress,
                    data: {
                        current: i + 1,
                        total: totalInvoices,
                        fileName: invoice.fileName,
                    },
                });

                await syncInvoiceToDrive(userId, invoice._id.toString());
                successCount++;

                onProgress?.({
                    type: 'synced',
                    message: `Successfully synced: ${invoice.fileName}`,
                    progress: currentProgress,
                    data: {
                        current: i + 1,
                        total: totalInvoices,
                        fileName: invoice.fileName,
                    },
                });
            } catch (error: any) {
                errorCount++;
                logger.error('Error syncing individual invoice', {
                    error: error.message,
                    invoiceId: invoice._id,
                    userId,
                });

                onProgress?.({
                    type: 'sync_error',
                    message: `Failed to sync: ${invoice.fileName} - ${error.message}`,
                    progress: currentProgress,
                    data: {
                        current: i + 1,
                        total: totalInvoices,
                        fileName: invoice.fileName,
                        error: error.message,
                    },
                });
            }
        }

        logger.info('All invoices synced to Google Drive', {
            userId,
            count: invoices.length,
            successCount,
            errorCount,
        });

        onProgress?.({
            type: 'sync_complete',
            message: `Sync completed: ${successCount} succeeded, ${errorCount} failed`,
            progress: 100,
            data: {
                total: totalInvoices,
                successCount,
                errorCount,
            },
        });
    } catch (error: any) {
        logger.error('Error syncing all invoices to Drive', {
            error: error.message,
            stack: error.stack,
            userId,
        });

        onProgress?.({
            type: 'error',
            message: `Sync failed: ${error.message}`,
            progress: 0,
        });

        throw error;
    }
};

export const syncInvoiceToDriveIfConnected = async (
    userId: string,
    invoiceId: string
): Promise<void> => {
    try {
        const settings = await Settings.findOne({ userId });
        if (settings?.googleDrive?.isConnected) {
            await syncInvoiceToDrive(userId, invoiceId);
        }
    } catch (error: any) {
        logger.error('Error syncing invoice to Drive', {
            error: error.message,
            invoiceId,
            userId,
        });
    }
};
