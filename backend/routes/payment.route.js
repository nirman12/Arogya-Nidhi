import express from 'express';
import {
  esewaInitiate,
  esewaSuccess,
  esewaFailure,
  khaltiInitiate,
  khaltiPaymentStatus,
} from '../controllers/paymentController.js';
import authUser from '../middlewares/authUser.js';

const router = express.Router();

// eSewa Payment Flow
router.post('/esewa/initiate', authUser, esewaInitiate);
router.post('/esewa/success', authUser, esewaSuccess);
router.post('/esewa/failure', authUser, esewaFailure);

// Khalti Payment Flow
router.post('/khalti/initiate', authUser, khaltiInitiate);
router.post('/khalti/payment-status', authUser, khaltiPaymentStatus);

export default router;
