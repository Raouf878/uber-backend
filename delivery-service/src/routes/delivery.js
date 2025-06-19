import express from 'express';
import { GetDeliveries } from '../controllers/Delivery/GetDeliveriesController.js';
import { CreateDelivery } from '../controllers/Delivery/CreateDeliveryController.js';
import { UpdateDeliveryStatus } from '../controllers/Delivery/UpdateDeliveryStatusController.js';
import { TrackDelivery } from '../controllers/Tracking/TrackDeliveryController.js';
import { 
  authenticateToken, 
  authorize, 
  validateDeliveryAccess, 
  validateDeliveryDriver, 
  validateOrderForDelivery 
} from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, authorize(['delivery_driver', 'admin']), GetDeliveries)
  .post(authenticateToken, validateDeliveryDriver, validateOrderForDelivery, CreateDelivery);

router.route('/:id/status')
  .patch(authenticateToken, validateDeliveryDriver, validateDeliveryAccess, UpdateDeliveryStatus);

router.route('/:id/track')
  .get(authenticateToken, validateDeliveryAccess, TrackDelivery); // Now requires auth

// Customer routes - get their deliveries
router.route('/customer/:customerId')
  .get(authenticateToken, (req, res, next) => {
    // Validate customer can only see their own deliveries
    const targetCustomerId = parseInt(req.params.customerId);
    const currentUserId = req.user.id;
    
    if (currentUserId !== targetCustomerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own deliveries'
      });
    }
    next();
  }, (req, res) => {
    res.json({ message: 'Get customer deliveries - implement GetCustomerDeliveries controller' });
  });

// Delivery driver routes - get their assigned deliveries
router.route('/driver/:driverId')
  .get(authenticateToken, (req, res, next) => {
    // Validate driver can only see their own deliveries
    const targetDriverId = parseInt(req.params.driverId);
    const currentUserId = req.user.id;
    
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
