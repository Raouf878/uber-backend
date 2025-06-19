import OrderService from '../../data-layer/DataAccess.js';

// Initialize the order service
const orderService = new OrderService();

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create order'
    });
  }
};

// Get order by ID
export const getOrder = async (req, res) => {
  try {
    console.log('Fetching order with ID:', req.params.id);
    
    const order = await orderService.getOrder(parseInt(req.params.id));
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get order'
    });
  }
};

// Get all orders for a specific user
export const getUserOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status || undefined
    };
    
    const result = await orderService.getUserOrders(
      parseInt(req.params.userId),
      options
    );
    res.json(result);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get user orders'
    });
  }
};

// Get all orders for a specific restaurant
export const getRestaurantOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status || undefined
    };
    
    const result = await orderService.getRestaurantOrders(
      parseInt(req.params.restaurantId),
      options
    );
    res.json(result);
  } catch (error) {
    console.error('Get restaurant orders error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get restaurant orders'
    });
  }
};

// Get all orders with filters
export const getAllOrders = async (req, res) => {
  try {
    const { page, limit, status, userId, restaurantId, dateFrom, dateTo } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status || undefined,
      userId: userId ? parseInt(userId) : undefined,
      restaurantId: restaurantId ? parseInt(restaurantId) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };
    
    const result = await orderService.getAllOrders(options);
    
    // Enhanced response with calculated totals and summary
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
      
      // Count items
      const itemsCount = order.orderItems ? order.orderItems.length : 0;
      const menusCount = order.orderMenus ? order.orderMenus.length : 0;
      
      return {
        ...order,
        calculatedTotal: parseFloat(calculatedTotal.toFixed(2)),
        totalMatch: Math.abs(calculatedTotal - order.totalPrice) < 0.01,
        itemsCount,
        menusCount,
        totalItemsAndMenus: itemsCount + menusCount,
        hasPayments: order.payments && order.payments.length > 0,
        hasDeliveries: order.deliveries && order.deliveries.length > 0,
        formattedTimestamp: new Date(order.timestamp).toLocaleString()
      };
    });
    
    // Calculate summary statistics
    const summary = {
      totalOrders: result.pagination.totalCount,
      statusBreakdown: {},
      totalRevenue: 0,
      averageOrderValue: 0
    };
    
    enhancedOrders.forEach(order => {
      // Status breakdown
      if (!summary.statusBreakdown[order.status]) {
        summary.statusBreakdown[order.status] = 0;
      }
      summary.statusBreakdown[order.status]++;
      
      // Revenue calculation
      summary.totalRevenue += order.totalPrice;
    });
    
    summary.totalRevenue = parseFloat(summary.totalRevenue.toFixed(2));
    summary.averageOrderValue = result.pagination.totalCount > 0 
      ? parseFloat((summary.totalRevenue / result.pagination.totalCount).toFixed(2)) 
      : 0;
    
    res.json({
      orders: enhancedOrders,
      pagination: result.pagination,
      summary,
      filters: options
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get orders'
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const order = await orderService.updateOrderStatus(
      parseInt(req.params.id),
      status
    );
    
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update order status'
    });
  }
};

// Add item to order
export const addItemToOrder = async (req, res) => {
  try {
    const orderItem = await orderService.addItemToOrder(
      parseInt(req.params.orderId),
      req.body
    );
    
    res.status(201).json(orderItem);
  } catch (error) {
    console.error('Add item to order error:', error);
    res.status(400).json({
      error: error.message || 'Failed to add item to order'
    });
  }
};

// Remove item from order
export const removeItemFromOrder = async (req, res) => {
  try {
    const result = await orderService.removeItemFromOrder(
      parseInt(req.params.orderId),
      parseInt(req.params.itemId)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Remove item from order error:', error);
    res.status(400).json({
      error: error.message || 'Failed to remove item from order'
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await orderService.cancelOrder(
      parseInt(req.params.id),
      reason
    );
    
    res.json(order);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(400).json({
      error: error.message || 'Failed to cancel order'
    });
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    const stats = await orderService.getOrderStats(
      restaurantId ? parseInt(restaurantId) : null
    );
    
    res.json(stats);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get order statistics'
    });
  }
};

// Get order with items details
export const getOrderWithItems = async (req, res) => {
  try {
    const order = await orderService.getOrder(parseInt(req.params.id));
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
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
    
    // Count items and menus
    const itemsCount = order.orderItems ? order.orderItems.length : 0;
    const menusCount = order.orderMenus ? order.orderMenus.length : 0;
    
    // Enhanced order details
    const enhancedOrder = {
      ...order,
      calculatedTotal: parseFloat(calculatedTotal.toFixed(2)),
      totalMatch: Math.abs(calculatedTotal - order.totalPrice) < 0.01,
      itemsCount,
      menusCount,
      totalItemsAndMenus: itemsCount + menusCount,
      hasPayments: order.payments && order.payments.length > 0,
      hasDeliveries: order.deliveries && order.deliveries.length > 0,
      formattedTimestamp: new Date(order.timestamp).toLocaleString(),
      orderSummary: {
        status: order.status,
        totalPrice: order.totalPrice,
        calculatedTotal: parseFloat(calculatedTotal.toFixed(2)),
        itemsCount,
        menusCount,
        paymentsCount: order.payments ? order.payments.length : 0,
        deliveriesCount: order.deliveries ? order.deliveries.length : 0
      }
    };
    
    res.json(enhancedOrder);
  } catch (error) {
    console.error('Get order with items error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get order details'
    });
  }
};

// Get all orders with full details (test endpoint without auth)
export const getAllOrdersWithDetails = async (req, res) => {
  try {
    const { page, limit, status, userId, restaurantId, dateFrom, dateTo } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status || undefined,
      userId: userId ? parseInt(userId) : undefined,
      restaurantId: restaurantId ? parseInt(restaurantId) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };

    const result = await orderService.getAllOrders(options);
    
    // If you want a single order format instead of array, return first order with details
    if (result.orders && result.orders.length > 0) {
      const orderWithDetails = result.orders[0]; // Get first order
      
      // Calculate total from items and menus
      let calculatedTotal = 0;
      
      if (orderWithDetails.orderItems) {
        calculatedTotal += orderWithDetails.orderItems.reduce((sum, orderItem) => {
          return sum + (orderItem.item.price * orderItem.quantity);
        }, 0);
      }
      
      if (orderWithDetails.orderMenus) {
        calculatedTotal += orderWithDetails.orderMenus.reduce((sum, orderMenu) => {
          return sum + orderMenu.menu.price;
        }, 0);
      }
      
      return res.json({
        success: true,
        order: {
          ...orderWithDetails,
          calculatedTotal,
          itemsCount: orderWithDetails.orderItems ? orderWithDetails.orderItems.length : 0,
          menusCount: orderWithDetails.orderMenus ? orderWithDetails.orderMenus.length : 0
        },
        allOrders: result.orders, // Include all orders as well
        pagination: result.pagination
      });
    }
    
    res.json({
      success: true,
      orders: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all orders with details error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get orders with details'
    });
  }
};
