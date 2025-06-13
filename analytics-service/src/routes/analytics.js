import express from 'express';
import { GetAnalytics } from '../controllers/Analytics/GetAnalyticsController.js';
import { GenerateReport } from '../controllers/Reports/GenerateReportController.js';
import { GetMetrics } from '../controllers/Metrics/GetMetricsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetAnalytics);

router.route('/reports')
  .post(authenticateToken, GenerateReport);

router.route('/metrics')
  .get(authenticateToken, GetMetrics);

export default router;
