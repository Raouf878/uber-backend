import { PrismaClient } from '@prisma/client';
import prisma from '../src/config/dbConnection.js';
import DatabaseService from './DatabaseService.js';

class DeliveryService extends DatabaseService {
  constructor() {
    super();
    this.prisma = prisma;
  }

  // Create a new delivery
  async createDelivery(deliveryData) {
    const { orderId, userId, status = 'PENDING', pickupTime, deliveryTime } = deliveryData;
    
    try {
      // Validate required fields
      if (!orderId || !userId) {
        throw new Error('Order ID and User ID are required');
      }

      // Convert to integers
      const orderIdInt = this.validateId(orderId);
      const userIdInt = this.validateId(userId);

      // Validate status
      const validStatus = this.validateDeliveryStatus(status);

      // Verify order and user exist
      const [order, user] = await Promise.all([
        this.prisma.order.findUnique({ where: { id: orderIdInt } }),
        this.prisma.user.findUnique({ where: { id: userIdInt } })
      ]);

      if (!order) {
        throw new Error('Order not found');
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is a delivery driver
      if (user.role !== 'delivery_driver' && user.role !== 'admin') {
        throw new Error('User must be a delivery driver to create deliveries');
      }

      // Check if delivery already exists for this order
      const existingDelivery = await this.prisma.delivery.findFirst({
        where: { orderId: orderIdInt }
      });

      if (existingDelivery) {
        throw new Error('Delivery already exists for this order');
      }

      // Create delivery
      const delivery = await this.prisma.delivery.create({
        data: {
          orderId: orderIdInt,
          userId: userIdInt,
          status: validStatus,
          pickupTime: pickupTime ? new Date(pickupTime) : new Date(),
          deliveryTime: deliveryTime ? new Date(deliveryTime) : null
        },
        include: {
          order: {
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
                  name: true,
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
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      return {
        success: true,
        delivery
      };

    } catch (error) {
      console.error('Create delivery error:', error);
      throw error;
    }
  }

  // Get delivery by ID
  async getDelivery(deliveryId) {
    try {
      const id = this.validateId(deliveryId);

      const delivery = await this.prisma.delivery.findUnique({
        where: { id },
        include: {
          order: {
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
                  name: true,
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
                      name: true,
                      price: true
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
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!delivery) {
        return null;
      }

      return delivery;
    } catch (error) {
      this.handleError(error, 'Get delivery');
    }
  }

  // Get all deliveries with filters
  async getAllDeliveries(options = {}) {
    try {
      const { page = 1, limit = 10, status, userId, orderId, dateFrom, dateTo } = options;
      const { skip, take } = this.getPaginationOptions(page, limit);

      const where = {};
      
      if (status) where.status = this.validateDeliveryStatus(status);
      if (userId) where.userId = this.validateId(userId);
      if (orderId) where.orderId = this.validateId(orderId);
      
      if (dateFrom || dateTo) {
        where.pickupTime = {};
        if (dateFrom) where.pickupTime.gte = new Date(dateFrom);
        if (dateTo) where.pickupTime.lte = new Date(dateTo);
      }

      const [deliveries, totalCount] = await Promise.all([
        this.prisma.delivery.findMany({
          where,
          skip,
          take,
          include: {
            order: {
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
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            pickupTime: 'desc'
          }
        }),
        this.prisma.delivery.count({ where })
      ]);

      return {
        deliveries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) * parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        }
      };
    } catch (error) {
      this.handleError(error, 'Get all deliveries');
    }
  }

  // Get deliveries for a specific driver
  async getDriverDeliveries(userId, options = {}) {
    try {
      const id = this.validateId(userId);
      const { page = 1, limit = 10, status } = options;
      const { skip, take } = this.getPaginationOptions(page, limit);

      const where = { userId: id };
      if (status) {
        where.status = this.validateDeliveryStatus(status);
      }

      const [deliveries, totalCount] = await Promise.all([
        this.prisma.delivery.findMany({
          where,
          skip,
          take,
          include: {
            order: {
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
              }
            }
          },
          orderBy: {
            pickupTime: 'desc'
          }
        }),
        this.prisma.delivery.count({ where })
      ]);

      return {
        deliveries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) * parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1
        }
      };
    } catch (error) {
      this.handleError(error, 'Get driver deliveries');
    }
  }

  // Get available orders for delivery (orders without assigned delivery)
  async getAvailableOrders(options = {}) {
    try {
      const { page = 1, limit = 10, restaurantId, status = 'CONFIRMED' } = options;
      const { skip, take } = this.getPaginationOptions(page, limit);

      const where = {
        status: status, // Only confirmed orders are available for delivery
        deliveries: {
          none: {} // Orders without any deliveries
        }
      };

      if (restaurantId) {
        where.restaurantId = this.validateId(restaurantId);
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
            timestamp: 'asc' // Oldest orders first
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
      this.handleError(error, 'Get available orders');
    }
  }

  // Accept an order for delivery
  async acceptOrderForDelivery(orderId, userId) {
    try {
      const orderIdInt = this.validateId(orderId);
      const userIdInt = this.validateId(userId);

      // Verify user is a delivery driver
      const user = await this.prisma.user.findUnique({
        where: { id: userIdInt }
      });

      if (!user) {
        throw new Error('User not found');
      }

      this.validateDeliveryRole(user.role);

      // Check if order exists and is available for delivery
      const order = await this.prisma.order.findUnique({
        where: { id: orderIdInt },
        include: {
          deliveries: true
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.deliveries && order.deliveries.length > 0) {
        throw new Error('Order already has a delivery assigned');
      }

      if (order.status !== 'CONFIRMED') {
        throw new Error('Order must be confirmed before it can be accepted for delivery');
      }

      // Create delivery and update order status
      const result = await this.prisma.$transaction(async (prisma) => {
        const delivery = await prisma.delivery.create({
          data: {
            orderId: orderIdInt,
            userId: userIdInt,
            status: 'ACCEPTED',
            pickupTime: new Date(),
            deliveryTime: null
          },
          include: {
            order: {
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
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        });

        // Update order status to indicate it's being prepared for delivery
        await prisma.order.update({
          where: { id: orderIdInt },
          data: { status: 'PREPARING_FOR_DELIVERY' }
        });

        return delivery;
      });

      return {
        success: true,
        delivery: result
      };

    } catch (error) {
      console.error('Accept order for delivery error:', error);
      throw error;
    }
  }

  // Update delivery status
  async updateDeliveryStatus(deliveryId, status, userId) {
    try {
      const id = this.validateId(deliveryId);
      const validStatus = this.validateDeliveryStatus(status);

      // Get current delivery
      const delivery = await this.prisma.delivery.findUnique({
        where: { id },
        include: {
          order: true,
          user: true
        }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      // Check if user is authorized to update this delivery
      if (delivery.userId !== userId && delivery.user.role !== 'admin') {
        throw new Error('Not authorized to update this delivery');
      }

      const updateData = {
        status: validStatus
      };

      // Set delivery time when status is DELIVERED
      if (validStatus === 'DELIVERED') {
        updateData.deliveryTime = new Date();
      }

      // Update delivery and order status
      const result = await this.prisma.$transaction(async (prisma) => {
        const updatedDelivery = await prisma.delivery.update({
          where: { id },
          data: updateData,
          include: {
            order: {
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
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        });

        // Update order status based on delivery status
        let orderStatus = delivery.order.status;
        if (validStatus === 'PICKED_UP') {
          orderStatus = 'OUT_FOR_DELIVERY';
        } else if (validStatus === 'DELIVERED') {
          orderStatus = 'DELIVERED';
        } else if (validStatus === 'CANCELLED') {
          orderStatus = 'DELIVERY_CANCELLED';
        }

        if (orderStatus !== delivery.order.status) {
          await prisma.order.update({
            where: { id: delivery.orderId },
            data: { status: orderStatus }
          });
        }

        return updatedDelivery;
      });

      return {
        success: true,
        delivery: result
      };

    } catch (error) {
      console.error('Update delivery status error:', error);
      throw error;
    }
  }

  // Get delivery statistics
  async getDeliveryStats(userId = null, options = {}) {
    try {
      const { dateFrom, dateTo } = options;
      const where = {};

      if (userId) {
        where.userId = this.validateId(userId);
      }

      if (dateFrom || dateTo) {
        where.pickupTime = {};
        if (dateFrom) where.pickupTime.gte = new Date(dateFrom);
        if (dateTo) where.pickupTime.lte = new Date(dateTo);
      }

      const [
        totalDeliveries,
        statusBreakdown,
        avgDeliveryTime
      ] = await Promise.all([
        this.prisma.delivery.count({ where }),
        this.prisma.delivery.groupBy({
          by: ['status'],
          where,
          _count: {
            status: true
          }
        }),
        this.prisma.delivery.aggregate({
          where: {
            ...where,
            status: 'DELIVERED',
            deliveryTime: { not: null }
          },
          _avg: {
            deliveryTime: true
          }
        })
      ]);

      const stats = {
        totalDeliveries,
        statusBreakdown: statusBreakdown.reduce((acc, curr) => {
          acc[curr.status] = curr._count.status;
          return acc;
        }, {}),
        avgDeliveryTime: avgDeliveryTime._avg.deliveryTime
      };

      return stats;
    } catch (error) {
      this.handleError(error, 'Get delivery stats');
    }
  }

  // Cancel delivery
  async cancelDelivery(deliveryId, userId) {
    try {
      const id = this.validateId(deliveryId);

      const delivery = await this.prisma.delivery.findUnique({
        where: { id },
        include: {
          order: true,
          user: true
        }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      // Check authorization
      if (delivery.userId !== userId && delivery.user.role !== 'admin') {
        throw new Error('Not authorized to cancel this delivery');
      }

      if (delivery.status === 'DELIVERED') {
        throw new Error('Cannot cancel a completed delivery');
      }

      // Cancel delivery and update order status
      const result = await this.prisma.$transaction(async (prisma) => {
        const cancelledDelivery = await prisma.delivery.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: {
            order: {
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
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        });

        // Update order status back to confirmed so it can be picked up by another driver
        await prisma.order.update({
          where: { id: delivery.orderId },
          data: { status: 'CONFIRMED' }
        });

        return cancelledDelivery;
      });

      return {
        success: true,
        delivery: result
      };

    } catch (error) {
      console.error('Cancel delivery error:', error);
      throw error;
    }
  }
}

export default DeliveryService;
