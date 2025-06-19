class DatabaseService {
  constructor() {
    this.prisma = null;
  }

  // Validate ID (ensure it's a positive integer)
  validateId(id) {
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      throw new Error('Invalid ID provided');
    }
    return numId;
  }

  // Handle database errors
  handleError(error, operation) {
    console.error(`${operation} error:`, error);
    
    if (error.code === 'P2002') {
      throw new Error('Record with this data already exists');
    } else if (error.code === 'P2025') {
      throw new Error('Record not found');
    } else if (error.code === 'P2003') {
      throw new Error('Foreign key constraint failed');
    } else if (error.code === 'P2014') {
      throw new Error('The change you are trying to make would violate the required relation');
    } else {
      throw new Error(error.message || `${operation} failed`);
    }
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

  // Common date range filter
  getDateRangeFilter(dateFrom, dateTo) {
    const filter = {};
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.gte = new Date(dateFrom);
      if (dateTo) filter.timestamp.lte = new Date(dateTo);
    }
    return filter;
  }

  // Validate delivery status
  validateDeliveryStatus(status) {
    const validStatuses = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid delivery status. Valid statuses are: ${validStatuses.join(', ')}`);
    }
    return status;
  }

  // Validate user role for delivery operations
  validateDeliveryRole(role) {
    const validRoles = ['delivery_driver', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Only delivery drivers and admins can perform delivery operations');
    }
    return role;
  }
}

export default DatabaseService;
