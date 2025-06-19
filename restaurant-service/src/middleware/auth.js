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

export const validateRestaurantOwnership = async (req, res, next) => {
  try {
    const restaurantId = req.params.id || req.params.restaurantId;
    const userId = req.user.id;

    // Import here to avoid circular dependency
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) },
      select: { userId: true }
    });

    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    // Allow if user owns the restaurant or is admin
    const isOwner = restaurant.userId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own restaurants'
      });
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Restaurant ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate restaurant ownership'
    });
  }
};

export const validateMenuOwnership = async (req, res, next) => {
  try {
    const menuId = req.params.menuId;
    const userId = req.user.id;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const menu = await prisma.menu.findUnique({
      where: { id: parseInt(menuId) },
      include: { restaurant: { select: { userId: true } } }
    });

    if (!menu) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu not found' 
      });
    }

    const isOwner = menu.restaurant.userId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access menus from your own restaurants'
      });
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Menu ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate menu ownership'
    });
  }
};

export const validateItemOwnership = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.user.id;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const item = await prisma.items.findUnique({
      where: { id: parseInt(itemId) },
      include: { restaurant: { select: { userId: true } } }
    });

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }

    const isOwner = item.restaurant.userId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access items from your own restaurants'
      });
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('Item ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate item ownership'
    });
  }
};
