import { Router } from 'express';
import * as controller from "../controllers/authController.js";
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validations/auth.validation.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshTokenSchema), controller.refreshToken);
router.post('/logout', validate(refreshTokenSchema), controller.logout);

// Get current authenticated user (local users table)
router.get('/me', authenticate, controller.me);

// Protected routes
router.post('/logout-all', authenticate, controller.logoutAll);
// Doctor profile endpoints (Supabase-backed doctor_profiles)
router.get('/doctor/profile', authenticate, requireRole('doctor'), controller.getDoctorProfile);
router.post('/doctor/update-profile', authenticate, requireRole('doctor'), controller.updateDoctorProfile);

export default router;