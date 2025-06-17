import express from 'express';
import { CreateOrder } from '../controllers/Orders/CreateOrderController.js';
import { GetOrders } from '../controllers/Orders/GetOrdersController.js';
import { UpdateOrderStatus } from '../controllers/Orders/UpdateOrderStatusController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .post(authenticateToken, CreateOrder)
  .get(authenticateToken, GetOrders);

router.route('/:orderId/status')
  .patch(authenticateToken, UpdateOrderStatus);

export default router;
