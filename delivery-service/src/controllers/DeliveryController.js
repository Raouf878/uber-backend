import DeliveryService from '../../data-layer/DataAccess.js';

// Initialize the delivery service
const deliveryService = new DeliveryService();

// Create a new delivery
export const createDelivery = async (req, res) => {
  try {
    const result = await deliveryService.createDelivery(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create delivery'
    });
  }
};

// Get delivery by ID
export const getDelivery = async (req, res) => {
  try {
    console.log('Fetching delivery with ID:', req.params.id);
    
    const delivery = await deliveryService.getDelivery(parseInt(req.params.id));
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get delivery'
    });
  }
};

// Get all deliveries with filters
export const getAllDeliveries = async (req, res) => {
  try {
    const { page, limit, status, userId, orderId, dateFrom, dateTo } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status || undefined,
      userId: userId ? parseInt(userId) : undefined,
      orderId: orderId ? parseInt(orderId) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };

    const result = await deliveryService.getAllDeliveries(options);
    
    // Enhanced response with calculated information
    const enhancedDeliveries = result.deliveries.map(delivery => {
      // Calculate delivery duration if completed
      let deliveryDuration = null;
      if (delivery.status === 'DELIVERED' && delivery.deliveryTime && delivery.pickupTime) {
        const pickupTime = new Date(delivery.pickupTime);
        const deliveryTime = new Date(delivery.deliveryTime);
        deliveryDuration = Math.round((deliveryTime - pickupTime) / (1000 * 60)); // Duration in minutes
      }
      
      // Calculate order total from items and menus
      let orderTotal = delivery.order.totalPrice || 0;
      
      return {
        ...delivery,
        deliveryDuration,
        orderTotal,
        formattedPickupTime: new Date(delivery.pickupTime).toLocaleString(),
        formattedDeliveryTime: delivery.deliveryTime ? new Date(delivery.deliveryTime).toLocaleString() : null,
        canUpdate: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status),
        isCompleted: delivery.status === 'DELIVERED',
        isCancelled: delivery.status === 'CANCELLED'
      };
    });
    
    // Calculate summary statistics
    const summary = {
      totalDeliveries: result.pagination.totalCount,
      statusBreakdown: {},
      completedDeliveries: 0,
      cancelledDeliveries: 0,
      avgDeliveryTime: 0
    };
    
    let totalDeliveryTime = 0;
    let completedCount = 0;
    
    enhancedDeliveries.forEach(delivery => {
      // Status breakdown
      if (!summary.statusBreakdown[delivery.status]) {
        summary.statusBreakdown[delivery.status] = 0;
      }
      summary.statusBreakdown[delivery.status]++;
      
      // Count completed and cancelled
      if (delivery.status === 'DELIVERED') {
        summary.completedDeliveries++;
        if (delivery.deliveryDuration) {
          totalDeliveryTime += delivery.deliveryDuration;
          completedCount++;
        }
      } else if (delivery.status === 'CANCELLED') {
        summary.cancelledDeliveries++;
      }
    });
    
    summary.avgDeliveryTime = completedCount > 0 
      ? Math.round(totalDeliveryTime / completedCount) 
      : 0;
    
    res.json({
      deliveries: enhancedDeliveries,
      pagination: result.pagination,
      summary,
      filters: options
    });
  } catch (error) {
    console.error('Get all deliveries error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get deliveries'
    });
  }
};

// Get deliveries for a specific driver
export const getDriverDeliveries = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status || undefined
    };
    
    const result = await deliveryService.getDriverDeliveries(
      parseInt(req.params.userId),
      options
    );
    
    // Enhanced response with driver-specific information
    const enhancedDeliveries = result.deliveries.map(delivery => {
      let deliveryDuration = null;
      if (delivery.status === 'DELIVERED' && delivery.deliveryTime && delivery.pickupTime) {
        const pickupTime = new Date(delivery.pickupTime);
        const deliveryTime = new Date(delivery.deliveryTime);
        deliveryDuration = Math.round((deliveryTime - pickupTime) / (1000 * 60));
      }
      
      return {
        ...delivery,
        deliveryDuration,
        formattedPickupTime: new Date(delivery.pickupTime).toLocaleString(),
        formattedDeliveryTime: delivery.deliveryTime ? new Date(delivery.deliveryTime).toLocaleString() : null,
        canUpdate: ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status),
        nextValidStatuses: getNextValidStatuses(delivery.status)
      };
    });
    
    res.json({
      deliveries: enhancedDeliveries,
      pagination: result.pagination,
      driverInfo: {
        userId: parseInt(req.params.userId),
        activeDeliveries: enhancedDeliveries.filter(d => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
        completedToday: enhancedDeliveries.filter(d => {
          if (d.status !== 'DELIVERED') return false;
          const today = new Date();
          const deliveryDate = new Date(d.deliveryTime);
          return deliveryDate.toDateString() === today.toDateString();
        }).length
      }
    });
  } catch (error) {
    console.error('Get driver deliveries error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get driver deliveries'
    });
  }
};

// Get available orders for delivery
export const getAvailableOrders = async (req, res) => {
  try {
    const { page, limit, restaurantId, status } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      restaurantId: restaurantId ? parseInt(restaurantId) : undefined,
      status: status || 'CONFIRMED'
    };

    const result = await deliveryService.getAvailableOrders(options);
    
    // Enhanced response with order information
    const enhancedOrders = result.orders.map(order => {
      // Calculate total from items and menus
      let calculatedTotal = 0;
      
      if (order.orderItems) {
        calculatedTotal += order.orderItems.reduce((sum, orderItem) => {
          return sum + (orderItem.item.price * orderItem.quantity);
        }, 0);
      }
      
      if (order.orderMenus) {
        calculatedTotal += order.orderMenus.reduce((sum, orderMenu) => {
          return sum + orderMenu.menu.price;
        }, 0);
      }
      
      // Calculate order age
      const orderAge = Math.round((new Date() - new Date(order.timestamp)) / (1000 * 60)); // Age in minutes
      
      return {
        ...order,
        calculatedTotal: parseFloat(calculatedTotal.toFixed(2)),
        itemsCount: order.orderItems ? order.orderItems.length : 0,
        menusCount: order.orderMenus ? order.orderMenus.length : 0,
        orderAge,
        formattedTimestamp: new Date(order.timestamp).toLocaleString(),
        priority: orderAge > 30 ? 'HIGH' : orderAge > 15 ? 'MEDIUM' : 'LOW'
      };
    });
    
    res.json({
      orders: enhancedOrders,
      pagination: result.pagination,
      summary: {
        totalAvailable: result.pagination.totalCount,
        highPriority: enhancedOrders.filter(o => o.priority === 'HIGH').length,
        mediumPriority: enhancedOrders.filter(o => o.priority === 'MEDIUM').length,
        lowPriority: enhancedOrders.filter(o => o.priority === 'LOW').length
      }
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get available orders'
    });
  }
};

// Accept an order for delivery
export const acceptOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.id; // From auth middleware
    
    const result = await deliveryService.acceptOrderForDelivery(orderId, userId);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(400).json({
      error: error.message || 'Failed to accept order for delivery'
    });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const deliveryId = parseInt(req.params.id);
    const userId = req.user.id; // From auth middleware
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = await deliveryService.updateDeliveryStatus(deliveryId, status, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update delivery status'
    });
  }
};

// Cancel delivery
export const cancelDelivery = async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const userId = req.user.id; // From auth middleware
    
    const result = await deliveryService.cancelDelivery(deliveryId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Cancel delivery error:', error);
    res.status(400).json({
      error: error.message || 'Failed to cancel delivery'
    });
  }
};

// Get delivery statistics
export const getDeliveryStats = async (req, res) => {
  try {
    const { userId, dateFrom, dateTo } = req.query;
    const options = {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };
    
    // If user is not admin, only show their own stats
    const targetUserId = req.user.role === 'admin' 
      ? (userId ? parseInt(userId) : null)
      : req.user.id;
    
    const stats = await deliveryService.getDeliveryStats(targetUserId, options);
    
    res.json({
      success: true,
      stats,
      period: {
        from: dateFrom || 'all time',
        to: dateTo || 'now'
      },
      userId: targetUserId
    });
  } catch (error) {
    console.error('Get delivery stats error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get delivery statistics'
    });
  }
};

// Helper function to get next valid statuses based on current status
function getNextValidStatuses(currentStatus) {
  const statusFlow = {
    'PENDING': ['ACCEPTED', 'CANCELLED'],
    'ACCEPTED': ['PICKED_UP', 'CANCELLED'],
    'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
    'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [], // Final state
    'CANCELLED': [] // Final state
  };
  
  return statusFlow[currentStatus] || [];
}
