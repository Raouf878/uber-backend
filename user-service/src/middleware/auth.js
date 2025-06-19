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

export const validateUserOwnership = (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Allow if user is accessing their own data or is admin
    if (currentUserId === targetUserId || userRole === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own profile'
    });
  } catch (error) {
    console.error('User ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate user ownership'
    });
  }
};

export const validateAdminOrSelf = (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Allow if admin or accessing own data
    if (userRole === 'admin' || currentUserId === targetUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges or own profile access required'
    });
  } catch (error) {
    console.error('Admin or self validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate permissions'
    });
  }
};
