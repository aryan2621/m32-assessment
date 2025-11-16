import express from 'express';
import {
    getSettings,
    initiateGoogleDriveAuth,
    handleGoogleDriveCallback,
    disconnectDrive,
    syncAllInvoicesSSE,
} from '../controllers/settingsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getSettings);
router.get('/google-drive/auth', protect, initiateGoogleDriveAuth);
router.get('/google-drive/callback', handleGoogleDriveCallback);
router.post('/google-drive/disconnect', protect, disconnectDrive);
router.post('/google-drive/sync-all', protect, syncAllInvoicesSSE);

export default router;

