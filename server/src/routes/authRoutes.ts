import express from 'express';
import passport from 'passport';
import {
    signup,
    login,
    logout,
    updateProfile,
    changePassword,
    googleAuthCallback,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import {
    validate,
    signupSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
} from '../middleware/validateRequest';

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/logout', protect, logout);
router.put('/update-profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleAuthCallback);

export default router;
