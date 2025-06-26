import { PrismaClient } from '@prisma/client';
import prisma from '../src/config/dbConnection.js'
import DatabaseService from './DatabaseService.js';
import connectDB from '../src/config/mongoDb.js';
import mongoose from 'mongoose';

class OrderService extends DatabaseService {
  constructor() {
    super();
    this.prisma = prisma;
    this.connectDB = connectDB;
    this.initializeMongoDB();
  }

  async initializeMongoDB() {
    try {
      await this.connectDB();
      console.log('MongoDB connection initialized in OrderService');
    } catch (error) {
      console.error('Failed to initialize MongoDB connection:', error);
    }
  }

  // Common database operations
  async executeTransaction(operations) {
    return await this.prisma.$transaction(operations);
  }

  // Common validation
  validateId(id) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('Invalid ID provided');
    }
    return parseInt(id);
  }

  // Common error handling
  handleError(error, operation) {
    console.error(`${operation} error:`, error);
    
    if (error.code === 'P2002') {
      throw new Error('Duplicate entry found');
    }
    
    if (error.code === 'P2025') {
      throw new Error('Record not found');
    }
    
    throw error;
  }

  // Common pagination
  getPaginationOptions(page = 1, limit = 10) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    return {
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    };
  }

  // Create a new order
  async createOrder(orderData) {
    const { userId, restaurantId, items, menus, totalPrice } = orderData;
    
    try {
      // Validate required fields
      if (!userId || !restaurantId || !totalPrice) {
        throw new Error('User ID, Restaurant ID, and total price are required');
      }

      // Convert to integers
      const userIdInt = typeof userId === 'string' ? parseInt(userId) : userId;
      const restaurantIdInt = typeof restaurantId === 'string' ? parseInt(restaurantId) : restaurantId;

      // Verify user and restaurant exist
      const [user, restaurant] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userIdInt } }),
        this.prisma.restaurant.findUnique({ where: { id: restaurantIdInt } })
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      // Create order with transaction
      const result = await this.prisma.$transaction(async (prisma) => {        // Create the order
        const order = await prisma.order.create({
          data: {
            userId: userIdInt,
            restaurantId: restaurantIdInt,
            totalPrice: parseFloat(totalPrice),
            status: "PENDING",
            timestamp: new Date()
          }
        });

        // Add order items if provided
        if (items && items.length > 0) {
          const orderItems = items.map(item => ({
            orderId: order.id,
            itemId: parseInt(item.itemId),
            quantity: parseInt(item.quantity)
          }));

          await prisma.orderItem.createMany({
            data: orderItems
          });
        }

        // Add order menus if provided
        if (menus && menus.length > 0) {
          const orderMenus = menus.map(menu => ({
            orderId: order.id,
            menuId: parseInt(menu.menuId)
          }));

          await prisma.orderMenu.createMany({
            data: orderMenus
          });
        }

        return order;
      });

      return {
        success: true,
        order: result
      };

    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  // Get order by ID with all related data
  async getOrder(orderId) {
    try {
      const id = this.validateId(orderId);      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              userId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          orderItems: {
            include: {
              item: {
                select: {
                  id: true,
                  itemId: true,
                  name: true,
                  price: true,
                  status: true,
                  imageUrl: true,
                  restaurantId: true
                }
              }
            }
          },
          orderMenus: {
            include: {
              menu: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  restaurantId: true
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              method: true,
              status: true,
              transactionId: true
            }
          },
          deliveries: {
            select: {
              id: true,
              status: true,
              pickupTime: true,
              deliveryTime: true,
              userId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        return null;
      }

      return order;
    } catch (error) {
      this.handleError(error, 'Get order');
    }
  }

  // Get orders for a specific user
  async getUserOrders(userId, options = {}) {
    try {
      const id = this.validateId(userId);
      const { page = 1, limit = 10, status } = options;
      const { skip, take } = this.getPaginationOptions(page, limit);

      const where = { userId: id };
      if (status) {
        where.status = status;
      }

      const [orders, totalCount] = await Promise.all([
        this.prisma.Order.findMany({
          where,
          skip,
          take,
          include: {
            restaurant: {
              select: {
                id: true,
                name: true
              }
            },
            orderItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    imageUrl: true
                  }
                }
              }
            },
            orderMenus: {
              include: {
                menu: {
                  select: {
                    id: true,
                    name: true,
                    price: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }),
        this.prisma.order.count({ where })
      ]);

      return {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) * parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        }
      };
    } catch (error) {
      this.handleError(error, 'Get user orders');
    }
  }

  // Get orders for a specific restaurant
  async getRestaurantOrders(restaurantId, options = {}) {
    try {
      const id = this.validateId(restaurantId);
      const { page = 1, limit = 10, status } = options;
      const { skip, take } = this.getPaginationOptions(page, limit);

      const where = { restaurantId: id };
      if (status) {
        where.status = status;
      }

      const [orders, totalCount] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            orderItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    imageUrl: true
                  }
                }
              }
            },
            orderMenus: {
              include: {
                menu: {
                  select: {
                    id: true,
                    name: true,
                    price: true
                  }
                }
              }
            },
            deliveries: true,
            payments: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        }),
        this.prisma.Order.count({ where })
      ]);

      return {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) * parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        }
      };
    } catch (error) {
      this.handleError(error, 'Get restaurant orders');
    }  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const id = this.validateId(orderId);
      
      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const order = await this.prisma.order.update({
        where: { id },
        data: { 
          status,
          // Update timestamp when status changes
          timestamp: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          restaurant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return order;
    } catch (error) {
      this.handleError(error, 'Update order status');
    }
  }

  // Add item to existing order
  async addItemToOrder(orderId, itemData) {
    try {
      const id = this.validateId(orderId);
      const { itemId, quantity } = itemData;

      // Verify order exists and is still pending
      const order = await this.prisma.order.findUnique({
        where: { id }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Cannot modify order that is not pending');
      }

      // Verify item exists
      const item = await this.prisma.items.findUnique({
        where: { id: parseInt(itemId) }
      });

      if (!item) {
        throw new Error('Item not found');
      }

      // Check if item already exists in order
      const existingOrderItem = await this.prisma.orderItem.findUnique({
        where: {
          orderId_itemId: {
            orderId: id,
            itemId: parseInt(itemId)
          }
        }
      });

      let orderItem;
      if (existingOrderItem) {
        // Update quantity
        orderItem = await this.prisma.orderItem.update({
          where: {
            orderId_itemId: {
              orderId: id,
              itemId: parseInt(itemId)
            }
          },
          data: {
            quantity: existingOrderItem.quantity + parseInt(quantity)
          },
          include: {
            item: true
          }
        });
      } else {
        // Create new order item
        orderItem = await this.prisma.orderItem.create({
          data: {
            orderId: id,
            itemId: parseInt(itemId),
            quantity: parseInt(quantity)
          },
          include: {
            item: true
          }
        });
      }

      // Update order total price
      const newTotal = order.totalPrice + (item.price * parseInt(quantity));
      await this.prisma.order.update({
        where: { id },
        data: { totalPrice: newTotal }
      });

      return orderItem;
    } catch (error) {
      this.handleError(error, 'Add item to order');
    }
  }

  // Remove item from order
  async removeItemFromOrder(orderId, itemId) {
    try {
      const orderIdInt = this.validateId(orderId);
      const itemIdInt = this.validateId(itemId);

      // Get order and order item
      const [order, orderItem] = await Promise.all([
        this.prisma.order.findUnique({ where: { id: orderIdInt } }),
        this.prisma.orderItem.findUnique({
          where: {
            orderId_itemId: {
              orderId: orderIdInt,
              itemId: itemIdInt
            }
          },
          include: { item: true }
        })
      ]);

      if (!order) {
        throw new Error('Order not found');
      }

      if (!orderItem) {
        throw new Error('Item not found in order');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Cannot modify order that is not pending');
      }

      // Remove the order item
      await this.prisma.orderItem.delete({
        where: {
          orderId_itemId: {
            orderId: orderIdInt,
            itemId: itemIdInt
          }
        }
      });

      // Update order total price
      const newTotal = order.totalPrice - (orderItem.item.price * orderItem.quantity);
      await this.prisma.order.update({
        where: { id: orderIdInt },
        data: { totalPrice: Math.max(0, newTotal) }
      });

      return { success: true, message: 'Item removed from order' };
    } catch (error) {
      this.handleError(error, 'Remove item from order');
    }
  }

  // Get order statistics
  async getOrderStats(restaurantId = null) {
    try {
      const where = restaurantId ? { restaurantId: this.validateId(restaurantId) } : {};

      const stats = await this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        },
        _sum: {
          totalPrice: true
        }
      });

      const totalOrders = await this.prisma.order.count({ where });
      const totalRevenue = await this.prisma.order.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _sum: {
          totalPrice: true
        }
      });

      return {
        statusBreakdown: stats,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalPrice || 0
      };
    } catch (error) {
      this.handleError(error, 'Get order stats');
    }
  }

  // Cancel order
  async cancelOrder(orderId, reason = null) {
    try {
      const id = this.validateId(orderId);

      const order = await this.prisma.order.findUnique({
        where: { id }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const cancellableStatuses = ['PENDING', 'CONFIRMED'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new Error('Order cannot be cancelled at this stage');
      }

      const cancelledOrder = await this.prisma.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          restaurant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return cancelledOrder;
    } catch (error) {
      this.handleError(error, 'Cancel order');
    }
  }

  // Get all orders with filters
  async getAllOrders(options = {}) {
    try {
      const { page = 1, limit = 10, status, userId, restaurantId, dateFrom, dateTo } = options;
      const { skip, take } = this.getPaginationOptions(page, limit);

      const where = {};
      
      if (status) where.status = status;
      if (userId) where.userId = this.validateId(userId);
      if (restaurantId) where.restaurantId = this.validateId(restaurantId);
      
      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom) where.timestamp.gte = new Date(dateFrom);
        if (dateTo)        where.timestamp.lte = new Date(dateTo);
      }

      const [orders, totalCount] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            },
            restaurant: {
              select: {
                id: true,
                name: true,
                userId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            orderItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    itemId: true,
                    name: true,
                    price: true,
                    status: true,
                    imageUrl: true,
                    restaurantId: true
                  }
                }
              }
            },
            orderMenus: {
              include: {
                menu: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    restaurantId: true
                  }
                }
              }
            },
            payments: {
              select: {
                id: true,
                method: true,
                status: true,
                transactionId: true
              }
            },
            deliveries: {
              select: {
                id: true,
                status: true,
                pickupTime: true,
                deliveryTime: true,
                userId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }),
        this.prisma.order.count({ where })
      ]);return {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) * parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        }
      };
    } catch (error) {
      this.handleError(error, 'Get all orders');
    }
  }

  // Update order item quantity
  async updateOrderItemQuantity(orderId, itemId, quantity) {
    try {
      const orderIdInt = this.validateId(orderId);
      const itemIdInt = this.validateId(itemId);

      // Verify order exists and is pending
      const order = await this.prisma.order.findUnique({
        where: { id: orderIdInt }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Cannot modify order that is not pending');
      }

      // Update the order item quantity
      const orderItem = await this.prisma.orderItem.update({
        where: {
          orderId_itemId: {
            orderId: orderIdInt,
            itemId: itemIdInt
          }
        },
        data: {
          quantity: parseInt(quantity)
        },
        include: {
          item: true
        }
      });

      // Recalculate and update order total
      await this.updateOrderTotal(orderIdInt);

      return orderItem;
    } catch (error) {
      this.handleError(error, 'Update order item quantity');
    }
  }

  // Add menu to order
  async addMenuToOrder(orderId, menuId) {
    try {
      const orderIdInt = this.validateId(orderId);
      const menuIdInt = this.validateId(menuId);

      // Verify order exists and is pending
      const order = await this.prisma.order.findUnique({
        where: { id: orderIdInt }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Cannot modify order that is not pending');
      }

      // Verify menu exists
      const menu = await this.prisma.menu.findUnique({
        where: { id: menuIdInt }
      });

      if (!menu) {
        throw new Error('Menu not found');
      }

      // Check if menu already exists in order
      const existingOrderMenu = await this.prisma.orderMenu.findUnique({
        where: {
          orderId_menuId: {
            orderId: orderIdInt,
            menuId: menuIdInt
          }
        }
      });

      if (existingOrderMenu) {
        throw new Error('Menu already added to order');
      }

      // Add menu to order
      const orderMenu = await this.prisma.orderMenu.create({
        data: {
          orderId: orderIdInt,
          menuId: menuIdInt
        },
        include: {
          menu: true
        }
      });

      // Update order total
      await this.updateOrderTotal(orderIdInt);

      return orderMenu;
    } catch (error) {
      this.handleError(error, 'Add menu to order');
    }
  }

  // Remove menu from order
  async removeMenuFromOrder(orderId, menuId) {
    try {
      const orderIdInt = this.validateId(orderId);
      const menuIdInt = this.validateId(menuId);

      // Verify order exists and is pending
      const order = await this.prisma.order.findUnique({
        where: { id: orderIdInt }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Cannot modify order that is not pending');
      }

      // Remove the order menu
      await this.prisma.orderMenu.delete({
        where: {
          orderId_menuId: {
            orderId: orderIdInt,
            menuId: menuIdInt
          }
        }
      });

      // Update order total
      await this.updateOrderTotal(orderIdInt);

      return { success: true, message: 'Menu removed from order' };
    } catch (error) {
      this.handleError(error, 'Remove menu from order');
    }
  }

  // Get orders by date range
  async getOrdersByDateRange(startDate, endDate, options = {}) {
    try {
      const { page = 1, limit = 10, status, userId, restaurantId } = options;
      const { skip, take } = this.getPaginationOptions(page, limit);

      const where = {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };

      if (status) where.status = status;
      if (userId) where.userId = this.validateId(userId);
      if (restaurantId) where.restaurantId = this.validateId(restaurantId);

      const [orders, totalCount] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            restaurant: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }),
        this.prisma.order.count({ where })
      ]);

      return {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) * parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        },
        dateRange: {
          from: startDate,
          to: endDate
        }
      };
    } catch (error) {
      this.handleError(error, 'Get orders by date range');
    }
  }

  // Get orders by status
  async getOrdersByStatus(status, options = {}) {
    try {
      const { page = 1, limit = 10, userId, restaurantId } = options;
      const { skip, take } = this.getPaginationOptions(page, limit);

      const where = { status };
      if (userId) where.userId = this.validateId(userId);
      if (restaurantId) where.restaurantId = this.validateId(restaurantId);

      const [orders, totalCount] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            restaurant: {
              select: {
                id: true,
                name: true
              }
            },
            orderItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    price: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }),
        this.prisma.order.count({ where })
      ]);

      return {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) * parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        },
        status
      };
    } catch (error) {
      this.handleError(error, 'Get orders by status');
    }
  }

  // Validate order data
  async validateOrder(orderData) {
    try {
      const { userId, restaurantId, items, menus, totalPrice } = orderData;

      // Basic validation
      if (!userId || !restaurantId || !totalPrice) {
        throw new Error('User ID, Restaurant ID, and total price are required');
      }

      // Verify user and restaurant exist
      const [user, restaurant] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: this.validateId(userId) } }),
        this.prisma.restaurant.findUnique({ where: { id: this.validateId(restaurantId) } })
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      // Validate items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          const itemExists = await this.prisma.items.findUnique({
            where: { id: parseInt(item.itemId) }
          });
          
          if (!itemExists) {
            throw new Error(`Item with ID ${item.itemId} not found`);
          }

          if (!item.quantity || item.quantity <= 0) {
            throw new Error(`Invalid quantity for item ${item.itemId}`);
          }
        }
      }

      // Validate menus if provided
      if (menus && menus.length > 0) {
        for (const menu of menus) {
          const menuExists = await this.prisma.menu.findUnique({
            where: { id: parseInt(menu.menuId) }
          });
          
          if (!menuExists) {
            throw new Error(`Menu with ID ${menu.menuId} not found`);
          }
        }
      }

      return { valid: true, message: 'Order data is valid' };
    } catch (error) {
      throw error;
    }
  }

  // Calculate order total
  async calculateOrderTotal(orderId) {
    try {
      const id = this.validateId(orderId);

      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          orderItems: {
            include: {
              item: {
                select: {
                  price: true
                }
              }
            }
          },
          orderMenus: {
            include: {
              menu: {
                select: {
                  price: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      let total = 0;

      // Calculate total from items
      if (order.orderItems) {
        total += order.orderItems.reduce((sum, orderItem) => {
          return sum + (orderItem.item.price * orderItem.quantity);
        }, 0);
      }

      // Calculate total from menus
      if (order.orderMenus) {
        total += order.orderMenus.reduce((sum, orderMenu) => {
          return sum + orderMenu.menu.price;
        }, 0);
      }

      return total;
    } catch (error) {
      this.handleError(error, 'Calculate order total');
    }
  }

  // Update order total
  async updateOrderTotal(orderId) {
    try {
      const calculatedTotal = await this.calculateOrderTotal(orderId);
      
      const updatedOrder = await this.prisma.order.update({
        where: { id: this.validateId(orderId) },
        data: { totalPrice: calculatedTotal }
      });

      return updatedOrder;
    } catch (error) {
      this.handleError(error, 'Update order total');
    }
  }
}

export default OrderService;
