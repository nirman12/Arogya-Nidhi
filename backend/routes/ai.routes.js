import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { aiBooking, confirmBooking } from '../controllers/aiBooking.controller.js';

const router = Router();

router.post('/ai-booking', authenticate, requireRole('patient'), aiBooking);
router.post('/confirm-booking', authenticate, requireRole('patient'), confirmBooking);

export default router;