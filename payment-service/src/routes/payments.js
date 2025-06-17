import express from 'express';
import { CreatePayment } from '../controllers/Payments/CreatePaymentController.js';
import { ProcessPayment } from '../controllers/Payments/ProcessPaymentController.js';
import { GetPaymentStatus } from '../controllers/Payments/GetPaymentStatusController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/create')
  .post(authenticateToken, CreatePayment);

router.route('/process/:paymentId')
  .post(authenticateToken, ProcessPayment);

router.route('/status/:paymentId')
  .get(authenticateToken, GetPaymentStatus);

export default router;
