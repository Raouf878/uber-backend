import express from 'express';
import { GetDeliveries } from '../controllers/Delivery/GetDeliveriesController.js';
import { CreateDelivery } from '../controllers/Delivery/CreateDeliveryController.js';
import { UpdateDeliveryStatus } from '../controllers/Delivery/UpdateDeliveryStatusController.js';
import { TrackDelivery } from '../controllers/Tracking/TrackDeliveryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetDeliveries)
  .post(authenticateToken, CreateDelivery);

router.route('/:id/status')
  .patch(authenticateToken, UpdateDeliveryStatus);

router.route('/:id/track')
  .get(TrackDelivery);

export default router;
