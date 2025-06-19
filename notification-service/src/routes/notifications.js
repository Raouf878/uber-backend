import express from 'express';
import { GetNotifications } from '../controllers/Notifications/GetNotificationsController.js';
import { CreateNotification } from '../controllers/Notifications/CreateNotificationController.js';
import { SendEmail } from '../controllers/Email/SendEmailController.js';
import { SendSMS } from '../controllers/SMS/SendSMSController.js';
import { 
  authenticateToken, 
  authorize, 
  validateNotificationAccess, 
  validateSystemNotification, 
  validateCommunicationPermissions 
} from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, validateNotificationAccess, GetNotifications)
  .post(authenticateToken, validateSystemNotification, CreateNotification);

router.route('/email')
  .post(authenticateToken, validateCommunicationPermissions, SendEmail);

router.route('/sms')
  .post(authenticateToken, validateCommunicationPermissions, SendSMS);

// User-specific notification routes
router.route('/user/:userId')
  .get(authenticateToken, (req, res, next) => {
    // Validate user can only access their own notifications
    const targetUserId = parseInt(req.params.userId);
    const currentUserId = req.user.id;
    
    if (currentUserId !== targetUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own notifications'
      });
    }
    next();
  }, (req, res) => {
    res.json({ message: 'Get user notifications - implement GetUserNotifications controller' });
  });

// Admin routes for system-wide notifications
router.route('/system/broadcast')
  .post(authenticateToken, authorize(['admin']), (req, res) => {
    res.json({ message: 'Broadcast system notification - implement BroadcastNotification controller' });
  });

// Mark notification as read
router.route('/:notificationId/read')
  .patch(authenticateToken, (req, res) => {
    res.json({ message: 'Mark notification as read - implement MarkAsRead controller' });
  });

export default router;
