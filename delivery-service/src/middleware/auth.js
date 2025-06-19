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

export const validateDeliveryAccess = async (req, res, next) => {
  try {
    const deliveryId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const delivery = await prisma.delivery.findUnique({
      where: { id: parseInt(deliveryId) },
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
        },
        user: {
          select: {
            id: true
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery not found' 
      });
    }

    // Allow access if:
    // - User is the delivery driver (delivery.userId)
    // - User is the customer (order.userId)
    // - User is the restaurant owner (order.restaurant.userId)
    // - User is admin
    const isDeliveryDriver = delivery.userId === userId;
    const isCustomer = delivery.order.userId === userId;
    const isRestaurantOwner = delivery.order.restaurant.userId === userId;
    const isAdmin = userRole === 'admin';

    if (!isDeliveryDriver && !isCustomer && !isRestaurantOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access deliveries you are involved with'
      });
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Delivery access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate delivery access'
    });
  }
};

export const validateDeliveryDriver = (req, res, next) => {
  try {
    const userRole = req.user.role;

    // Only delivery drivers and admins can create/update deliveries
    if (userRole !== 'delivery_driver' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only delivery drivers can perform this action'
      });
    }

    next();
  } catch (error) {
    console.error('Delivery driver validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate delivery driver access'
    });
  }
};

export const validateOrderForDelivery = async (req, res, next) => {
  try {
    const orderId = req.body.orderId;

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
      select: { 
        id: true, 
        status: true,
        deliveries: true
      }
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if order is ready for delivery
    if (order.status !== 'READY') {
      return res.status(400).json({
        success: false,
        message: 'Order must be ready before creating delivery'
      });
    }

    // Check if delivery already exists for this order
    if (order.deliveries && order.deliveries.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Delivery already exists for this order'
      });
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Order validation for delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate order for delivery'
    });
  }
};
