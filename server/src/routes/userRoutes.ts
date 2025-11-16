import express from 'express';
import { getProfile, updateProfile, getStats } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { validate, updateProfileSchema } from '../middleware/validateRequest';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.get('/stats', protect, getStats);

export default router;
