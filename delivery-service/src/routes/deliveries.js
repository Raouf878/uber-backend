import express from 'express';
import {
  createDelivery,
  getDelivery,
  getAllDeliveries,
  getDriverDeliveries,
  getAvailableOrders,
  acceptOrder,
  updateDeliveryStatus,
  cancelDelivery,
  getDeliveryStats
} from '../controllers/DeliveryController.js';
import { 
  authenticateToken, 
  authorize, 
  validateDeliveryAccess, 
  validateDeliveryDriver,
  validateOrderForDelivery 
} from '../middleware/auth.js';
import { 
  validateRequest, 
  validateParams, 
  deliverySchemas, 
  paramSchemas 
} from '../middleware/validation.js';

const router = express.Router();

// Middleware to log route hits
router.use((req, res, next) => {
    console.log(`Delivery Route Hit: ${req.method} ${req.path}`);
    next();
});

// Delivery CRUD routes
router.post('/deliveries', 
  authenticateToken, 
  validateDeliveryDriver,
  validateRequest(deliverySchemas.createDelivery), 
  validateOrderForDelivery,
  createDelivery
);

router.get('/deliveries', 
  authenticateToken, 
  authorize(['admin', 'delivery_driver', 'restaurant_owner']), 
  getAllDeliveries
);

router.get('/deliveries/:id', 
  authenticateToken, 
  validateParams(paramSchemas.deliveryId), 
  validateDeliveryAccess, 
  getDelivery
);

router.put('/deliveries/:id/status', 
  authenticateToken, 
  validateParams(paramSchemas.deliveryId), 
  validateRequest(deliverySchemas.updateDeliveryStatus), 
  validateDeliveryDriver,
  updateDeliveryStatus
);

router.put('/deliveries/:id/cancel', 
  authenticateToken, 
  validateParams(paramSchemas.deliveryId), 
  validateDeliveryDriver,
  cancelDelivery
);

// Driver-specific routes
router.get('/drivers/:userId/deliveries', 
  authenticateToken, 
  validateParams(paramSchemas.userId), 
  authorize(['admin', 'delivery_driver']), 
  getDriverDeliveries
);

// Available orders for delivery
router.get('/orders/available', 
  authenticateToken, 
  validateDeliveryDriver,
  getAvailableOrders
);

router.post('/orders/:orderId/accept', 
  authenticateToken, 
  validateParams(paramSchemas.orderId), 
  validateDeliveryDriver,
  acceptOrder
);

// Statistics and reporting
router.get('/stats', 
  authenticateToken, 
  authorize(['admin', 'delivery_driver']), 
  getDeliveryStats
);

// Test routes (remove in production)
router.get('/test/deliveries', getAllDeliveries);
router.get('/test/orders/available', getAvailableOrders);

export default router;
