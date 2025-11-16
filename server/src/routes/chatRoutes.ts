import express from 'express';
import {
    createSession,
    getSessions,
    getSessionById,
    deleteSession,
    getSessionMessages,
    sendMessage,
    deleteMessage,
    uploadPdfChat,
} from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';
import { validate, createSessionSchema, sendMessageSchema } from '../middleware/validateRequest';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.post('/sessions', protect, validate(createSessionSchema), createSession);
router.get('/sessions', protect, getSessions);
router.get('/sessions/:id', protect, getSessionById);
router.delete('/sessions/:id', protect, deleteSession);
router.get('/sessions/:id/messages', protect, getSessionMessages);
router.post('/message', protect, validate(sendMessageSchema), sendMessage);
router.post('/upload-pdf', protect, upload.single('pdf'), uploadPdfChat);
router.delete('/messages/:id', protect, deleteMessage);

export default router;
