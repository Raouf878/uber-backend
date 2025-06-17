import express from 'express';
import { GetNotifications } from '../controllers/Notifications/GetNotificationsController.js';
import { CreateNotification } from '../controllers/Notifications/CreateNotificationController.js';
import { SendEmail } from '../controllers/Email/SendEmailController.js';
import { SendSMS } from '../controllers/SMS/SendSMSController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetNotifications)
  .post(authenticateToken, CreateNotification);

router.route('/email')
  .post(authenticateToken, SendEmail);

router.route('/sms')
  .post(authenticateToken, SendSMS);

export default router;
