import express from 'express';
import { CreatePayment } from '../controllers/Payments/CreatePaymentController.js';
import { ProcessPayment } from '../controllers/Payments/ProcessPaymentController.js';
import { GetPaymentStatus } from '../controllers/Payments/GetPaymentStatusController.js';
import { 
  authenticateToken, 
  authorize, 
  validatePaymentOwnership, 
  validateOrderOwnership 
} from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/create')
  .post(authenticateToken, validateOrderOwnership, CreatePayment);

router.route('/process/:paymentId')
  .post(authenticateToken, validatePaymentOwnership, ProcessPayment);

router.route('/status/:paymentId')
  .get(authenticateToken, validatePaymentOwnership, GetPaymentStatus);

// Admin routes for payment management
router.route('/admin/payments')
  .get(authenticateToken, authorize(['admin']), (req, res) => {
    res.json({ message: 'Get all payments - implement GetAllPayments controller' });
  });

router.route('/admin/payments/:paymentId')
  .get(authenticateToken, authorize(['admin']), (req, res) => {
    res.json({ message: 'Get payment details - implement GetPaymentDetails controller' });
  })
  .put(authenticateToken, authorize(['admin']), (req, res) => {
    res.json({ message: 'Update payment - implement UpdatePayment controller' });
  });

// Restaurant owner routes - view payments for their orders
router.route('/restaurant/:restaurantId/payments')
  .get(authenticateToken, authorize(['restaurant_owner', 'admin']), (req, res) => {
    res.json({ message: 'Get restaurant payments - implement GetRestaurantPayments controller' });
  });

export default router;
