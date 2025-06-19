// Order status constants
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

// Order status transitions
export const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY],
  [ORDER_STATUS.READY]: [ORDER_STATUS.OUT_FOR_DELIVERY],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: []
};

// Validate status transition
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

// Format order response
export const formatOrderResponse = (order) => {
  return {
    id: order.id,
    userId: order.userId,
    restaurantId: order.restaurantId,
    status: order.status,
    totalPrice: order.totalPrice,
    timestamp: order.timestamp,
    user: order.user ? {
      id: order.user.id,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      email: order.user.email
    } : null,
    restaurant: order.restaurant ? {
      id: order.restaurant.id,
      name: order.restaurant.name
    } : null,
    items: order.orderItems ? order.orderItems.map(orderItem => ({
      id: orderItem.item.id,
      name: orderItem.item.name,
      price: orderItem.item.price,
      quantity: orderItem.quantity,
      subtotal: orderItem.item.price * orderItem.quantity
    })) : [],
    menus: order.orderMenus ? order.orderMenus.map(orderMenu => ({
      id: orderMenu.menu.id,
      name: orderMenu.menu.name,
      price: orderMenu.menu.price
    })) : [],
    deliveries: order.deliveries || [],
    payments: order.payments || []
  };
};

// Calculate order total from items and menus
export const calculateOrderTotal = (items = [], menus = []) => {
  const itemsTotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  const menusTotal = menus.reduce((sum, menu) => {
    return sum + menu.price;
  }, 0);
  
  return itemsTotal + menusTotal;
};

// Generate order number
export const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Pagination helper
export const getPaginationMeta = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = parseInt(page);
  
  return {
    currentPage,
    totalPages,
    totalCount,
    limit: parseInt(limit),
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null
  };
};

// Response helper
export const createResponse = (success, data = null, message = null, error = null) => {
  const response = { success };
  
  if (data) response.data = data;
  if (message) response.message = message;
  if (error) response.error = error;
  
  return response;
};

// Async error handler
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
