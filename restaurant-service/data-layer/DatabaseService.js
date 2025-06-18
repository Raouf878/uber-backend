class DatabaseService {
    constructor() {
        if (this.constructor === DatabaseService) {
            throw new Error("Cannot instantiate abstract class DatabaseService");
        }
    }


    async createRestaurant(restaurantData) {
        throw new Error("Method 'createRestaurant()' must be implemented.");
    }
    async getRestaurant(restaurantId) {
        throw new Error("Method 'getRestaurant()' must be implemented.");
    }
    async getUserRestaurants(userId) {
        throw new Error("Method 'getUserRestaurants()' must be implemented.");
    }
    async getAllRestaurants() {
        throw new Error("Method 'getAllRestaurants()' must be implemented.");
    }
    async updateRestaurantLocation(restaurantId, locationData) {
        throw new Error("Method 'updateRestaurantLocation()' must be implemented.");
    }
    async deleteRestaurant(restaurantId) {
        throw new Error("Method 'deleteRestaurant()' must be implemented.");
    }
    async createMenu(restaurantId, menuData) {
        throw new Error("Method 'createMenu()' must be implemented.");
    }
    async getMenu(menuId) {
        throw new Error("Method 'getMenu()' must be implemented.");
    }
    async updateMenu(menuId, menuData) {
        throw new Error("Method 'updateMenu()' must be implemented.");
    }
    async deleteMenu(menuId) {
        throw new Error("Method 'deleteMenu()' must be implemented.");
    }
    async createItem(restaurantId, itemData, menuId = null) {
        throw new Error("Method 'createItem()' must be implemented.");
    }
    async getAllItems(options={}) {
        throw new Error("Method 'getAllItems()' must be implemented.");
    }
    async getItem(itemId){
        throw new Error("Method 'getItem()' must be implemented.");
    }
    async updateItem(itemId, itemData) {
        throw new Error("Method 'updateItem()' must be implemented.");
    }
    async deleteItem(itemId) {
        throw new Error("Method 'deleteItem()' must be implemented.");
    }
    async addItemToMenu(menuId, itemId) {
        throw new Error("Method 'addItemToMenu()' must be implemented.");
    }
    async removeItemFromMenu(menuId, itemId) {
        throw new Error("Method 'removeItemFromMenu()' must be implemented.");
    }
    async getMenuItems(menuId, options = {}) {
        throw new Error("Method 'getMenuItems()' must be implemented.");
    }
    async bulkAddItemsToMenu(menuId, items) {
        throw new Error("Method 'bulkAddItemsToMenu()' must be implemented.");
    }
    async bulkRemoveItemsFromMenu(menuId, itemIds) {
        throw new Error("Method 'bulkRemoveItemsFromMenu()' must be implemented.");
    }
    async getMenuStats(menuId) {
        throw new Error("Method 'getMenuStats()' must be implemented.");
    }
}
export default DatabaseService;