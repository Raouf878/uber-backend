import express from 'express';
import { ProxyRequest } from '../controllers/Gateway/ProxyController.js';
import { HealthCheck } from '../controllers/Health/HealthCheckController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Routes
router.route('/health')
  .get(HealthCheck);

router.route('/proxy/*')
  .all(rateLimiter(), ProxyRequest);

export default router;
