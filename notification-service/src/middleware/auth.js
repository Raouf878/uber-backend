import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const validateNotificationAccess = (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const targetUserId = req.query.userId || req.body.userId;

    // Admin can access all notifications
    if (userRole === 'admin') {
      return next();
    }

    // Users can only access their own notifications
    if (targetUserId && parseInt(targetUserId) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own notifications'
      });
    }

    next();
  } catch (error) {
    console.error('Notification access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate notification access'
    });
  }
};

export const validateSystemNotification = (req, res, next) => {
  try {
    const userRole = req.user.role;
    const notificationType = req.body.type;

    // Only admins and system services can send system-wide notifications
    const systemNotificationTypes = ['system_announcement', 'maintenance', 'emergency'];
    
    if (systemNotificationTypes.includes(notificationType) && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can send system notifications'
      });
    }

    next();
  } catch (error) {
    console.error('System notification validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate system notification access'
    });
  }
};

export const validateCommunicationPermissions = (req, res, next) => {
  try {
    const userRole = req.user.role;
    const targetUserId = req.body.targetUserId || req.body.userId;
    const currentUserId = req.user.id;

    // Admin can send to anyone
    if (userRole === 'admin') {
      return next();
    }

    // Restaurant owners can send to their customers
    if (userRole === 'restaurant_owner') {
      // Add logic to verify the target user is their customer
      return next();
    }

    // Users can only send to themselves (for testing)
    if (parseInt(targetUserId) !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only send notifications to yourself'
      });
    }

    next();
  } catch (error) {
    console.error('Communication permissions validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate communication permissions'
    });
  }
};
