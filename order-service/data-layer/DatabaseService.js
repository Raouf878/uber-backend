class DatabaseService {
    constructor() {
        if (this.constructor === DatabaseService) {
            throw new Error("Cannot instantiate abstract class DatabaseService");
        }
    }

    // Order CRUD operations
    async createOrder(orderData) {
        throw new Error("Method 'createOrder()' must be implemented.");
    }
    
    async getOrder(orderId) {
        throw new Error("Method 'getOrder()' must be implemented.");
    }
    
    async getUserOrders(userId, options = {}) {
        throw new Error("Method 'getUserOrders()' must be implemented.");
    }
    
    async getRestaurantOrders(restaurantId, options = {}) {
        throw new Error("Method 'getRestaurantOrders()' must be implemented.");
    }
    
    async getAllOrders(options = {}) {
        throw new Error("Method 'getAllOrders()' must be implemented.");
    }
    
    async updateOrderStatus(orderId, status) {
        throw new Error("Method 'updateOrderStatus()' must be implemented.");
    }
    
    async cancelOrder(orderId, reason = null) {
        throw new Error("Method 'cancelOrder()' must be implemented.");
    }

    // Order items management
    async addItemToOrder(orderId, itemData) {
        throw new Error("Method 'addItemToOrder()' must be implemented.");
    }
    
    async removeItemFromOrder(orderId, itemId) {
        throw new Error("Method 'removeItemFromOrder()' must be implemented.");
    }
    
    async updateOrderItemQuantity(orderId, itemId, quantity) {
        throw new Error("Method 'updateOrderItemQuantity()' must be implemented.");
    }

    // Order menu management
    async addMenuToOrder(orderId, menuId) {
        throw new Error("Method 'addMenuToOrder()' must be implemented.");
    }
    
    async removeMenuFromOrder(orderId, menuId) {
        throw new Error("Method 'removeMenuFromOrder()' must be implemented.");
    }

    // Statistics and analytics
    async getOrderStats(restaurantId = null) {
        throw new Error("Method 'getOrderStats()' must be implemented.");
    }
    
    async getOrdersByDateRange(startDate, endDate, options = {}) {
        throw new Error("Method 'getOrdersByDateRange()' must be implemented.");
    }
    
    async getOrdersByStatus(status, options = {}) {
        throw new Error("Method 'getOrdersByStatus()' must be implemented.");
    }

    // Order validation and business logic
    async validateOrder(orderData) {
        throw new Error("Method 'validateOrder()' must be implemented.");
    }
    
    async calculateOrderTotal(orderId) {
        throw new Error("Method 'calculateOrderTotal()' must be implemented.");
    }
    
    async updateOrderTotal(orderId) {
        throw new Error("Method 'updateOrderTotal()' must be implemented.");
    }
}

export default DatabaseService;
