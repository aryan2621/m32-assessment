import { Response } from 'express';
import Invoice from '../models/Invoice';
import Expense from '../models/Expense';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { uploadFile, deleteFile } from '../services/supabaseService';
import { processInvoice, ProgressCallback } from '../agents/invoiceAgent';
import { logger } from '../utils/logger';
import { UpdateInvoiceDTO } from '../dto/invoice.dto';
import { syncInvoiceToDriveIfConnected } from '../agents/driveSyncAgent';
import { config } from '../config/constants';

export const uploadInvoice = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        if (!req.file) {
            sendError(res, 'No file uploaded', 400);
            return;
        }

        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;
        const fileType = mimeType === 'application/pdf' ? 'pdf' : 'image';

        logger.debug('Invoice Upload Request', {
            userId: req.user._id.toString(),
            fileName,
            fileType,
            fileSize: fileBuffer.length,
            mimeType,
        });

        const { url } = await uploadFile(fileBuffer, fileName, req.file.mimetype);

        let extractedData;
        let isProcessed = false;
        let processingError: string | undefined;

        try {
            extractedData = await processInvoice(fileBuffer, fileType, req.file.mimetype);
            isProcessed = true;

            logger.debug('Invoice Processing Result', {
                userId: req.user._id.toString(),
                fileName,
                extractedData,
                isProcessed,
            });
        } catch (error: any) {
            logger.error('Invoice processing failed', {
                error: error.message,
                stack: error.stack,
            });
            processingError = error.message;
        }

        const invoice = await Invoice.create({
            userId: req.user._id,
            fileUrl: url,
            fileName,
            fileType,
            vendorName: extractedData?.vendorName || undefined,
            vendorEmail: extractedData?.vendorEmail || undefined,
            vendorPhone: extractedData?.vendorPhone || undefined,
            invoiceNumber: extractedData?.invoiceNumber || undefined,
            invoiceDate: extractedData?.invoiceDate
                ? new Date(extractedData.invoiceDate)
                : undefined,
            dueDate: extractedData?.dueDate ? new Date(extractedData.dueDate) : undefined,
            totalAmount: extractedData?.totalAmount || undefined,
            currency: extractedData?.currency || 'INR',
            taxAmount: extractedData?.taxAmount || undefined,
            subtotal: extractedData?.subtotal || undefined,
            items: extractedData?.items || [],
            category: 'other',
            status: 'pending',
            isProcessed,
            processingError,
        });

        if (extractedData && invoice.totalAmount) {
            await Expense.create({
                userId: req.user._id,
                invoiceId: invoice._id,
                amount: invoice.totalAmount,
                currency: invoice.currency,
                category: invoice.category,
                vendor: invoice.vendorName,
                description: `Invoice ${invoice.invoiceNumber || 'N/A'}`,
                date: invoice.invoiceDate || new Date(),
            });
        }

        await syncInvoiceToDriveIfConnected(req.user._id.toString(), invoice._id.toString());

        sendSuccess(
            res,
            {
                invoice,
                message: 'Invoice uploaded and processed successfully',
            },
            'Invoice uploaded and processed successfully',
            201
        );
    }
);

export const uploadInvoiceSSE = asyncHandler(
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

        if (!req.file) {
            res.writeHead(400, corsHeaders);
            res.write(
                `data: ${JSON.stringify({ type: 'error', message: 'No file uploaded' })}\n\n`
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
            const fileBuffer = req.file.buffer;
            const fileName = req.file.originalname;
            const mimeType = req.file.mimetype;
            const fileType = mimeType === 'application/pdf' ? 'pdf' : 'image';

            sendEvent({
                type: 'upload_start',
                message: 'Uploading file to storage...',
                progress: 5,
            });

            const { url } = await uploadFile(fileBuffer, fileName, req.file.mimetype);

            sendEvent({
                type: 'upload_complete',
                message: 'File uploaded to storage',
                progress: 10,
            });

            let extractedData;
            let isProcessed = false;
            let processingError: string | undefined;

            const progressCallback: ProgressCallback = (event) => {
                sendEvent(event);
            };

            try {
                extractedData = await processInvoice(
                    fileBuffer,
                    fileType,
                    req.file.mimetype,
                    progressCallback
                );
                isProcessed = true;
            } catch (error: any) {
                logger.error('Invoice processing failed', {
                    error: error.message,
                    stack: error.stack,
                });
                processingError = error.message;
                sendEvent({ type: 'error', message: `Processing failed: ${error.message}` });
            }

            sendEvent({ type: 'saving', message: 'Saving invoice to database...', progress: 95 });

            const invoice = await Invoice.create({
                userId: req.user._id,
                fileUrl: url,
                fileName,
                fileType,
                vendorName: extractedData?.vendorName || undefined,
                vendorEmail: extractedData?.vendorEmail || undefined,
                vendorPhone: extractedData?.vendorPhone || undefined,
                invoiceNumber: extractedData?.invoiceNumber || undefined,
                invoiceDate: extractedData?.invoiceDate
                    ? new Date(extractedData.invoiceDate)
                    : undefined,
                dueDate: extractedData?.dueDate ? new Date(extractedData.dueDate) : undefined,
                totalAmount: extractedData?.totalAmount || undefined,
                currency: extractedData?.currency || 'INR',
                taxAmount: extractedData?.taxAmount || undefined,
                subtotal: extractedData?.subtotal || undefined,
                items: extractedData?.items || [],
                category: 'other',
                status: 'pending',
                isProcessed,
                processingError,
            });

            if (extractedData && invoice.totalAmount) {
                await Expense.create({
                    userId: req.user._id,
                    invoiceId: invoice._id,
                    amount: invoice.totalAmount,
                    currency: invoice.currency,
                    category: invoice.category,
                    vendor: invoice.vendorName,
                    description: `Invoice ${invoice.invoiceNumber || 'N/A'}`,
                    date: invoice.invoiceDate || new Date(),
                });
            }

            sendEvent({ type: 'syncing', message: 'Syncing to Google Drive...', progress: 98 });
            await syncInvoiceToDriveIfConnected(req.user._id.toString(), invoice._id.toString());

            const invoiceJSON = JSON.parse(JSON.stringify(invoice));
            sendEvent({
                type: 'success',
                message: 'Invoice uploaded and processed successfully',
                progress: 100,
                data: {
                    invoice: invoiceJSON,
                },
            });

            res.end();
        } catch (error: any) {
            logger.error('Upload SSE error', { error: error.message });
            sendEvent({ type: 'error', message: error.message || 'An unexpected error occurred' });
            res.end();
        }
    }
);

export const getInvoices = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const { status, category, search, startDate, endDate, page = '1', limit = '10' } = req.query;

    const query: any = { userId: req.user._id };

    if (status) {
        query.status = status;
    }

    if (category) {
        query.category = category;
    }

    if (search) {
        query.$or = [
            { vendorName: { $regex: search, $options: 'i' } },
            { invoiceNumber: { $regex: search, $options: 'i' } },
        ];
    }

    if (startDate || endDate) {
        query.invoiceDate = {};
        if (startDate) {
            query.invoiceDate.$gte = new Date(startDate as string);
        }
        if (endDate) {
            query.invoiceDate.$lte = new Date(endDate as string);
        }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const invoices: any[] = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await Invoice.countDocuments(query);

    const transformedInvoices = invoices.map((invoice: any) => {
        const transformed = { ...invoice };
        transformed.id = transformed._id.toString();
        transformed.vendor = transformed.vendorName || '';
        transformed.amount = transformed.totalAmount || 0;
        transformed.date = transformed.invoiceDate
            ? new Date(transformed.invoiceDate).toISOString()
            : null;
        delete transformed._id;
        delete transformed.__v;
        return transformed;
    });

    sendSuccess(
        res,
        {
            invoices: transformedInvoices,
            page: pageNum,
            limit: limitNum,
            total,
        },
        'Invoices retrieved successfully'
    );
});

export const getInvoiceById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!invoice) {
            sendError(res, 'Invoice not found', 404);
            return;
        }

        sendSuccess(res, invoice, 'Invoice retrieved successfully');
    }
);

export const updateInvoice = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!invoice) {
            sendError(res, 'Invoice not found', 404);
            return;
        }

        const dto = UpdateInvoiceDTO.validate(req.body, res);
        if (!dto) return;

        const updateData: any = { ...dto };
        if (dto.invoiceDate) {
            updateData.invoiceDate = new Date(dto.invoiceDate);
        }
        if (dto.dueDate) {
            updateData.dueDate = new Date(dto.dueDate);
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (dto.totalAmount && invoice.totalAmount !== dto.totalAmount) {
            await Expense.findOneAndUpdate(
                { invoiceId: invoice._id },
                {
                    amount: dto.totalAmount,
                    category: dto.category || invoice.category,
                    vendor: dto.vendorName || invoice.vendorName,
                }
            );
        }

        sendSuccess(res, updatedInvoice, 'Invoice updated successfully');
    }
);

export const deleteInvoice = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!invoice) {
            sendError(res, 'Invoice not found', 404);
            return;
        }

        try {
            const url = new URL(invoice.fileUrl);
            const pathParts = url.pathname.split('/').filter((part) => part);
            const publicIndex = pathParts.indexOf('public');
            if (publicIndex !== -1 && pathParts.length > publicIndex + 2) {
                const filePath = pathParts.slice(publicIndex + 2).join('/');
                await deleteFile(filePath);
            }
        } catch (error) {}

        await Expense.deleteMany({ invoiceId: invoice._id });
        await Invoice.findByIdAndDelete(req.params.id);

        sendSuccess(res, null, 'Invoice deleted successfully');
    }
);

export const reprocessInvoice = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!invoice) {
            sendError(res, 'Invoice not found', 404);
            return;
        }

        try {
            const response = await fetch(invoice.fileUrl);
            const fileBuffer = Buffer.from(await response.arrayBuffer());

            const mimeType =
                invoice.fileType === 'pdf'
                    ? 'application/pdf'
                    : invoice.fileName?.toLowerCase().endsWith('.png')
                      ? 'image/png'
                      : invoice.fileName?.toLowerCase().endsWith('.webp')
                        ? 'image/webp'
                        : 'image/jpeg';

            const extractedData = await processInvoice(fileBuffer, invoice.fileType, mimeType);

            const updatedInvoice = await Invoice.findByIdAndUpdate(
                req.params.id,
                {
                    ...extractedData,
                    invoiceDate: extractedData.invoiceDate
                        ? new Date(extractedData.invoiceDate)
                        : undefined,
                    dueDate: extractedData.dueDate ? new Date(extractedData.dueDate) : undefined,
                    isProcessed: true,
                    processingError: undefined,
                },
                { new: true }
            );

            sendSuccess(res, updatedInvoice, 'Invoice reprocessed successfully');
        } catch (error: any) {
            await Invoice.findByIdAndUpdate(req.params.id, {
                isProcessed: false,
                processingError: error.message,
            });

            sendError(res, `Failed to reprocess invoice: ${error.message}`, 500);
        }
    }
);

export const downloadInvoice = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!invoice) {
            sendError(res, 'Invoice not found', 404);
            return;
        }

        try {
            const response = await fetch(invoice.fileUrl);

            if (!response.ok) {
                sendError(res, 'Failed to fetch invoice file', 500);
                return;
            }

            let contentType: string;
            if (invoice.fileType === 'pdf') {
                contentType = 'application/pdf';
            } else if (invoice.fileName?.toLowerCase().endsWith('.png')) {
                contentType = 'image/png';
            } else if (invoice.fileName?.toLowerCase().endsWith('.webp')) {
                contentType = 'image/webp';
            } else {
                contentType = 'image/jpeg';
            }

            const fileBuffer = Buffer.from(await response.arrayBuffer());

            res.setHeader('Content-Type', contentType);
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${invoice.fileName || 'invoice'}"`
            );
            res.setHeader('Content-Length', fileBuffer.length.toString());

            res.send(fileBuffer);
        } catch (error: any) {
            sendError(res, `Failed to download invoice: ${error.message}`, 500);
        }
    }
);

export const getDashboardStats = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const invoices = await Invoice.find({ userId: req.user._id });
        const expenses = await Expense.find({ userId: req.user._id });

        const totalInvoices = invoices.length;
        const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const totalInvoiceAmount = invoices.reduce(
            (sum, invoice) => sum + (invoice.totalAmount || 0),
            0
        );

        const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
        const pendingInvoices = invoices.filter((inv) => inv.status === 'pending').length;
        const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue').length;

        // Calculate top vendor by total spending
        const vendorTotals: Record<string, number> = {};

        invoices.forEach((invoice) => {
            if (invoice.vendorName && invoice.totalAmount) {
                vendorTotals[invoice.vendorName] =
                    (vendorTotals[invoice.vendorName] || 0) + invoice.totalAmount;
            }
        });

        expenses.forEach((expense) => {
            if (expense.vendor && expense.amount) {
                vendorTotals[expense.vendor] = (vendorTotals[expense.vendor] || 0) + expense.amount;
            }
        });

        let topVendor = 'N/A';
        let maxAmount = 0;

        Object.entries(vendorTotals).forEach(([vendor, amount]) => {
            if (amount > maxAmount) {
                maxAmount = amount;
                topVendor = vendor;
            }
        });

        sendSuccess(
            res,
            {
                totalInvoices,
                totalExpenses,
                totalInvoiceAmount,
                paidInvoices,
                pendingInvoices,
                overdueInvoices,
                topVendor,
            },
            'Dashboard stats retrieved successfully'
        );
    }
);
