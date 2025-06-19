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

export const validatePaymentOwnership = async (req, res, next) => {
  try {
    const paymentId = req.params.paymentId;
    const userId = req.user.id;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        order: {
          select: {
            userId: true,
            restaurant: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    // Allow if user owns the order, owns the restaurant, or is admin
    const isOrderOwner = payment.order.userId === userId;
    const isRestaurantOwner = payment.order.restaurant.userId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOrderOwner && !isRestaurantOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access payments for your own orders or restaurant'
      });
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Payment ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate payment ownership'
    });
  }
};

export const validateOrderOwnership = async (req, res, next) => {
  try {
    const orderId = req.body.orderId;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      select: { userId: true }
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Allow if user owns the order or is admin
    const isOrderOwner = order.userId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOrderOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create payments for your own orders'
      });
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Order ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate order ownership'
    });
  }
};
