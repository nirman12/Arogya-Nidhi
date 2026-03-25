import { Router } from 'express';
import * as controller from "../controllers/authController.js";
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validations/auth.validation.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshTokenSchema), controller.refreshToken);
router.post('/logout', validate(refreshTokenSchema), controller.logout);

// Protected routes
router.post('/logout-all', authenticate, controller.logoutAll);

export default router;