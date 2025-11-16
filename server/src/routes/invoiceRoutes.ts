import express from 'express';
import {
    uploadInvoice,
    uploadInvoiceSSE,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    reprocessInvoice,
    downloadInvoice,
    getDashboardStats,
} from '../controllers/invoiceController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { validate, updateInvoiceSchema } from '../middleware/validateRequest';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadInvoice);
router.post('/upload/sse', protect, upload.single('file'), uploadInvoiceSSE);
router.get('/dashboard/stats', protect, getDashboardStats);
router.get('/', protect, getInvoices);
router.get('/:id/download', protect, downloadInvoice);
router.get('/:id', protect, getInvoiceById);
router.put('/:id', protect, validate(updateInvoiceSchema), updateInvoice);
router.delete('/:id', protect, deleteInvoice);
router.post('/:id/reprocess', protect, reprocessInvoice);

export default router;
