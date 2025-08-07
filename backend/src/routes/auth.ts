import { Router } from 'express';
import * as authController from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { validateLogin, validateRegister } from '@/middleware/validation';
import { authLimiter } from '@/middleware/security';

const router = Router();

// Public routes
router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh', authLimiter, authController.refreshToken);

// Protected routes
router.use(authenticate); // Apply authentication to all routes below

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.post('/logout', authController.logout);

export default router;