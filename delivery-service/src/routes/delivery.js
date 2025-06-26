import express from 'express';
import DeliveryController from '../controllers/DeliveryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const deliveryController = new DeliveryController();

// Register delivery person (public route)
router.post('/register', deliveryController.registerDeliveryPerson.bind(deliveryController));

// Protected routes - require authentication
router.use(authenticateToken);

// Get available orders for delivery
router.get('/available-orders', deliveryController.getAvailableOrders.bind(deliveryController));

// Accept a delivery order
router.post('/accept-delivery', deliveryController.acceptDelivery.bind(deliveryController));

// Scan QR code to confirm pickup from restaurant
router.post('/scan-qr', deliveryController.scanQRCode.bind(deliveryController));

// Confirm delivery with client confirmation code
router.post('/confirm-delivery', deliveryController.confirmDeliveryWithCode.bind(deliveryController));

// Get delivery person's orders
router.get('/my-orders', deliveryController.getMyOrders.bind(deliveryController));

// Get delivery person's statistics
router.get('/my-stats', deliveryController.getMyStats.bind(deliveryController));

export default router;
    
    if (currentUserId !== targetDriverId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own deliveries'
      });
    }
    next();
  }, (req, res) => {
    res.json({ message: 'Get driver deliveries - implement GetDriverDeliveries controller' });
  });

// Restaurant routes - get deliveries for their orders
router.route('/restaurant/:restaurantId')
  .get(authenticateToken, authorize(['restaurant_owner', 'admin']), (req, res) => {
    res.json({ message: 'Get restaurant deliveries - implement GetRestaurantDeliveries controller' });
  });

export default router;
