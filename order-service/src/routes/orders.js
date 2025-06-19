import express from 'express';
import {
  createOrder,
  getOrder,
  getUserOrders,
  getRestaurantOrders,
  getAllOrders,
  getAllOrdersWithDetails,
  updateOrderStatus,
  addItemToOrder,
  removeItemFromOrder,
  cancelOrder,
  getOrderStats,
  getOrderWithItems
} from '../controllers/OrderController.js';
import prisma from '../config/dbConnection.js';
import { validateRequest, validateParams, orderSchemas, paramSchemas } from '../middleware/validation.js';
import { authenticateToken, authorize, validateOrderOwnership } from '../middleware/auth.js';

const router = express.Router();

// Middleware to log route hits
router.use((req, res, next) => {
    console.log(`Order Route Hit: ${req.method} ${req.path}`);
    next();
});

// Order CRUD routes
router.post('/orders', 
  authenticateToken, 
  validateRequest(orderSchemas.createOrder), 
  createOrder
);

router.get('/orders', 
  authenticateToken, 
  authorize(['admin', 'restaurant_owner']), 
  getAllOrders
);

router.get('/orders/:id', 
  authenticateToken, 
  validateParams(paramSchemas.orderId), 
  validateOrderOwnership, 
  getOrder
);

router.get('/orders/:id/details', 
  authenticateToken, 
  validateParams(paramSchemas.orderId), 
  validateOrderOwnership, 
  getOrderWithItems
);

router.put('/orders/:id/status', 
  authenticateToken, 
  validateParams(paramSchemas.orderId), 
  validateRequest(orderSchemas.updateOrderStatus), 
  authorize(['restaurant_owner', 'delivery_driver', 'admin']), 
  updateOrderStatus
);

router.put('/orders/:id/cancel', 
  authenticateToken, 
  validateParams(paramSchemas.orderId), 
  validateRequest(orderSchemas.cancelOrder), 
  validateOrderOwnership, 
  cancelOrder
);

// User orders routes
router.get('/users/:userId/orders', 
  authenticateToken, 
  validateParams(paramSchemas.userId), 
  getUserOrders
);

// Restaurant orders routes
router.get('/restaurants/:restaurantId/orders', 
  authenticateToken, 
  validateParams(paramSchemas.restaurantId), 
  authorize(['restaurant_owner', 'admin']), 
  getRestaurantOrders
);

// Order items management
router.post('/orders/:orderId/items', 
  authenticateToken, 
  validateRequest(orderSchemas.addItemToOrder), 
  validateOrderOwnership, 
  addItemToOrder
);

router.delete('/orders/:orderId/items/:itemId', 
  authenticateToken, 
  validateParams(paramSchemas.orderItemParams), 
  validateOrderOwnership, 
  removeItemFromOrder
);

// Statistics (admin only)
router.get('/stats/orders', 
  authenticateToken, 
  authorize(['admin']), 
  getOrderStats
);

// Health check for order service
router.get('/test-db', async (req, res) => {
  try {
    // Test Prisma connection
    const orderCount = await prisma.order.count();
    res.json({ 
      dbWorking: true, 
      orderCount,
      service: 'order-service' 
    });
  } catch (error) {
    res.status(500).json({ 
      dbWorking: false, 
      error: error.message,
      service: 'order-service'
    });
  }
});

// Test endpoint to get all orders without authentication (for testing)
router.get('/test/orders', getAllOrders);

// Test endpoint to get all orders with full details (no auth required)
router.get('/test/orders-detailed', getAllOrdersWithDetails);

export default router;
