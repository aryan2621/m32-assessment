import { Response } from 'express';
import ChatSession from '../models/ChatSession';
import ChatMessage from '../models/ChatMessage';
import { AuthRequest, IChatMessage, IChatSession } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { handleUserMessage } from '../agents/orchestrator';
import { logger } from '../utils/logger';
import { uploadFile } from '../services/supabaseService';
import pdf from 'pdf-parse';
import { CreateSessionDTO, SendMessageDTO } from '../dto/chat.dto';
import { syncInvoiceToDriveIfConnected } from '../agents/driveSyncAgent';

export const createSession = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const dto = CreateSessionDTO.validate(req.body, res);
        if (!dto) return;

        const { title } = dto;

        const session = await ChatSession.create({
            userId: req.user._id,
            title: title || 'New Chat',
        });

        sendSuccess(res, session, 'Chat session created successfully', 201);
    }
);

export const getSessions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const sessions = await ChatSession.find({ userId: req.user._id }).sort({ lastMessageAt: -1 });
    const sessionsJSON = sessions.map((session: IChatSession) => {
        return session.toJSON();
    });

    sendSuccess(res, sessionsJSON, 'Chat sessions retrieved successfully');
});

export const getSessionById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const session = await ChatSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!session) {
            sendError(res, 'Chat session not found', 404);
            return;
        }

        sendSuccess(res, session, 'Chat session retrieved successfully');
    }
);

export const deleteSession = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const session = await ChatSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!session) {
            sendError(res, 'Chat session not found', 404);
            return;
        }

        await ChatMessage.deleteMany({ sessionId: session._id });
        await ChatSession.findByIdAndDelete(req.params.id);

        sendSuccess(res, null, 'Chat session deleted successfully');
    }
);

export const getSessionMessages = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const session = await ChatSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!session) {
            sendError(res, 'Chat session not found', 404);
            return;
        }

        const messages = await ChatMessage.find({ sessionId: req.params.id }).sort({
            createdAt: 1,
        });

        // Convert to JSON to apply transformation
        const messagesJSON = messages.map((message: IChatMessage) => message.toJSON());

        sendSuccess(res, messagesJSON, 'Messages retrieved successfully');
    }
);

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        sendError(res, 'User not found', 404);
        return;
    }

    const dto = SendMessageDTO.validate(req.body, res);
    if (!dto) return;

    let { sessionId, content, message } = dto;

    const userMessage = content || message;
    if (!userMessage) {
        sendError(res, 'Message content is required', 400);
        return;
    }

    logger.debug('Chat Send Message Request', {
        userId: req.user._id.toString(),
        sessionId,
        message: userMessage,
    });

    let session;
    if (!sessionId) {
        session = await ChatSession.create({
            userId: req.user._id,
            title: userMessage.substring(0, 50),
        });
        sessionId = session._id.toString();
    } else {
        session = await ChatSession.findOne({
            _id: sessionId,
            userId: req.user._id,
        });

        if (!session) {
            sendError(res, 'Chat session not found', 404);
            return;
        }
    }

    const userMessageDoc = await ChatMessage.create({
        sessionId,
        userId: req.user._id,
        role: 'user',
        content: userMessage,
    });

    const recentMessages = await ChatMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    const conversationHistory = recentMessages.reverse().map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
    }));

    const aiResponse = await handleUserMessage(
        userMessage,
        conversationHistory,
        req.user._id.toString()
    );

    logger.debug('Chat Send Message Response', {
        userId: req.user._id.toString(),
        sessionId,
        aiResponseLength: aiResponse.length,
        aiResponsePreview: aiResponse.substring(0, 200),
    });

    const assistantMessageDoc = await ChatMessage.create({
        sessionId,
        userId: req.user._id,
        role: 'assistant',
        content: aiResponse,
    });

    await ChatSession.findByIdAndUpdate(sessionId, {
        lastMessageAt: new Date(),
    });

    const updatedSession = await ChatSession.findById(sessionId);

    const userMessageJSON = JSON.parse(JSON.stringify(userMessageDoc));
    const assistantMessageJSON = JSON.parse(JSON.stringify(assistantMessageDoc));
    const sessionJSON = updatedSession ? JSON.parse(JSON.stringify(updatedSession)) : undefined;

    sendSuccess(
        res,
        {
            userMessage: userMessageJSON,
            message: assistantMessageJSON,
            session: sessionJSON,
        },
        'Message sent successfully'
    );
});

export const deleteMessage = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        if (!req.user) {
            sendError(res, 'User not found', 404);
            return;
        }

        const message = await ChatMessage.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!message) {
            sendError(res, 'Message not found', 404);
            return;
        }

        await ChatMessage.findByIdAndDelete(req.params.id);

        sendSuccess(res, null, 'Message deleted successfully');
    }
);

export const uploadPdfChat = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        const sendEvent = (event: {
            type: string;
            message: string;
            progress?: number;
            data?: any;
        }) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        };

        try {
            if (!req.user) {
                sendEvent({ type: 'error', message: 'User not authenticated' });
                res.end();
                return;
            }

            if (!req.file) {
                sendEvent({ type: 'error', message: 'No file uploaded' });
                res.end();
                return;
            }

            const allowedMimeTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
            ];

            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                sendEvent({
                    type: 'error',
                    message: 'Only PDF and image files (JPEG, PNG, WebP) are allowed',
                });
                res.end();
                return;
            }

            const { sessionId } = req.body;
            const fileBuffer = req.file.buffer;
            const fileName = req.file.originalname;
            const mimeType = req.file.mimetype;
            const isPdf = mimeType === 'application/pdf';
            const fileType = isPdf ? 'pdf' : 'image';

            sendEvent({
                type: 'upload_start',
                message: `Processing ${isPdf ? 'PDF' : 'image'} file...`,
                progress: 10,
            });

            let pdfText: string | undefined;
            if (isPdf) {
                sendEvent({
                    type: 'extracting',
                    message: 'Extracting text from PDF...',
                    progress: 30,
                });

                try {
                    const pdfData = await pdf(fileBuffer);
                    pdfText = pdfData.text;
                } catch (error: any) {
                    logger.error('PDF extraction failed', { error: error.message });
                    sendEvent({
                        type: 'error',
                        message: `Failed to extract text from PDF: ${error.message}`,
                    });
                    res.end();
                    return;
                }

                if (!pdfText || pdfText.trim().length === 0) {
                    sendEvent({
                        type: 'error',
                        message: 'No text content found in PDF',
                    });
                    res.end();
                    return;
                }

                sendEvent({
                    type: 'extraction_complete',
                    message: 'Text extracted successfully',
                    progress: 50,
                });
            } else {
                sendEvent({
                    type: 'extraction_complete',
                    message: 'Image file ready for processing',
                    progress: 50,
                });
            }

            let session;
            if (!sessionId) {
                sendEvent({
                    type: 'creating_session',
                    message: 'Creating chat session...',
                    progress: 60,
                });

                const fileTypeLabel = isPdf ? 'PDF' : 'Image';
                session = await ChatSession.create({
                    userId: req.user._id,
                    title: `${fileTypeLabel}: ${fileName.substring(0, 50)}`,
                });
            } else {
                session = await ChatSession.findOne({
                    _id: sessionId,
                    userId: req.user._id,
                });

                if (!session) {
                    sendEvent({ type: 'error', message: 'Chat session not found' });
                    res.end();
                    return;
                }
            }

            sendEvent({
                type: 'session_ready',
                message: 'Session ready',
                progress: 70,
            });

            sendEvent({
                type: 'processing_invoice',
                message: 'Processing invoice with AI...',
                progress: 80,
            });

            const { url } = await uploadFile(fileBuffer, fileName, req.file.mimetype);

            let extractedData;
            let invoiceCreated = false;
            try {
                const { processInvoice } = await import('../agents/invoiceAgent');
                extractedData = await processInvoice(fileBuffer, fileType, mimeType);

                const Invoice = (await import('../models/Invoice')).default;
                const Expense = (await import('../models/Expense')).default;

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
                    isProcessed: true,
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

                await syncInvoiceToDriveIfConnected(
                    req.user._id.toString(),
                    invoice._id.toString()
                );

                invoiceCreated = true;
            } catch (error: any) {
                logger.error('Invoice processing failed in chat', { error: error.message });
            }

            const fileTypeLabel = isPdf ? 'PDF' : 'image';
            const userMessage = invoiceCreated
                ? `I've uploaded an invoice ${fileTypeLabel} (${fileName}). The invoice has been processed and saved.`
                : isPdf && pdfText
                  ? `I've uploaded a PDF document (${fileName}):\n\n${pdfText}`
                  : `I've uploaded an ${fileTypeLabel} file (${fileName}).`;

            sendEvent({
                type: 'saving_message',
                message: 'Saving message...',
                progress: 90,
            });

            const userMessageDoc = await ChatMessage.create({
                sessionId: session._id,
                userId: req.user._id,
                role: 'user',
                content: userMessage,
            });

            sendEvent({
                type: 'generating_response',
                message: 'Generating AI response...',
                progress: 95,
            });

            const recentMessages = await ChatMessage.find({ sessionId: session._id })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            const conversationHistory = recentMessages.reverse().map((msg) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            }));

            const aiResponse = await handleUserMessage(
                userMessage,
                conversationHistory,
                req.user._id.toString()
            );

            const assistantMessageDoc = await ChatMessage.create({
                sessionId: session._id,
                userId: req.user._id,
                role: 'assistant',
                content: aiResponse,
            });

            await ChatSession.findByIdAndUpdate(session._id, {
                lastMessageAt: new Date(),
            });

            const updatedSession = await ChatSession.findById(session._id);

            const pdfSessionJSON = updatedSession
                ? JSON.parse(JSON.stringify(updatedSession))
                : undefined;
            const pdfUserMessageJSON = JSON.parse(JSON.stringify(userMessageDoc));
            const pdfAssistantMessageJSON = JSON.parse(JSON.stringify(assistantMessageDoc));

            sendEvent({
                type: 'complete',
                message: `${isPdf ? 'PDF' : 'Image'} processed successfully`,
                progress: 100,
                data: {
                    session: pdfSessionJSON,
                    userMessage: pdfUserMessageJSON,
                    assistantMessage: pdfAssistantMessageJSON,
                },
            });

            res.end();
        } catch (error: any) {
            logger.error('File upload SSE error', {
                error: error.message,
                stack: error.stack,
            });
            sendEvent({
                type: 'error',
                message: error.message || 'An unexpected error occurred',
            });
            res.end();
        }
    }
);
