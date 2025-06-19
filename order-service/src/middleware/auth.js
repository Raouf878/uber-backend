import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  console.log('=== Token Authentication Debug ===');
  
  // Check Authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  // If no token in header, check cookies
  if (!token && req.cookies) {
    token = req.cookies.token || req.cookies.authToken || req.cookies.jwt;
  }

  console.log('Token found:', token ? 'Yes' : 'No');
  console.log('Token source:', authHeader ? 'Authorization header' : 'Cookie');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  console.log('Order Service JWT_SECRET from env:', process.env.JWT_SECRET);
  
  const JWT_SECRET = process.env.JWT_SECRET || 'KDKSOQSIJDSOQKDQSKDJZOIDJOZOS_JSJSHG';
  console.log('Using JWT_SECRET for verification:', JWT_SECRET);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification error:', err);
      console.log('Error name:', err.name);
      console.log('Error message:', err.message);
      
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        debug: {
          error: err.name,
          message: err.message
        }
      });
    }
    console.log('Token verified successfully. User:', user);
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

export const validateOrderOwnership = async (req, res, next) => {
    try {
        const orderId = req.params.id || req.params.orderId;
        const userId = req.user.id;

        // Import here to avoid circular dependency
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            select: { userId: true, restaurantId: true, restaurant: { select: { userId: true } } }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Allow if user owns the order or owns the restaurant
        const isOrderOwner = order.userId === userId;
        const isRestaurantOwner = order.restaurant.userId === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isOrderOwner && !isRestaurantOwner && !isAdmin) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only access your own orders or orders from your restaurant'
            });
        }

        await prisma.$disconnect();
        next();
    } catch (error) {
        console.error('Order ownership validation error:', error);
        res.status(500).json({
            error: 'Validation failed',
            message: 'Failed to validate order ownership'
        });
    }
};
