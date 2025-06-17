import RestaurantService from '../../data-layer/DataAccess.js';

// Initialize the restaurant service
const restaurantService = new RestaurantService();

// Create a new restaurant
export const createRestaurant = async (req, res) => {
  try {
    const result = await restaurantService.createRestaurant(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create restaurant'
    });
  }
};

// Get restaurant by ID
export const getRestaurant = async (req, res) => {
  try {
    console.log('Fetching restaurant with ID:', req.params.id);
    console.log('Request params:', parseInt(req.params.id));
    
    const restaurant = await restaurantService.getRestaurant(
      parseInt(req.params.id)
    );
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get restaurant'
    });
  }
};

// Get all restaurants for a specific user
export const getUserRestaurants = async (req, res) => {
  try {
    const restaurants = await restaurantService.getUserRestaurants(
      parseInt(req.params.userId)
    );
    res.json(restaurants);
  } catch (error) {
    console.error('Get user restaurants error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get user restaurants'
    });
  }
};

// Get all restaurants with pagination
export const getAllRestaurants = async (req, res) => {
  try {
    const { page, limit, userId } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      userId: userId ? parseInt(userId) : undefined
    };
    
    const result = await restaurantService.getAllRestaurants(options);
    res.json(result);
  } catch (error) {
    console.error('Get all restaurants error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get restaurants'
    });
  }
};

// Update restaurant location
export const updateRestaurantLocation = async (req, res) => {
  try {
    const location = await restaurantService.updateRestaurantLocation(
      parseInt(req.params.id),
      req.body
    );
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update location'
    });
  }
};

// Delete restaurant
export const deleteRestaurant = async (req, res) => {
  try {
    await restaurantService.deleteRestaurant(
      parseInt(req.params.id)
    );
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete restaurant'
    });
  }
};

// Create menu
export const createMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuData = req.body;

      const result = await restaurantService.createMenu(parseInt(restaurantId), menuData);
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create menu',
        error: error.message
      });
    }
  }

  /**
   * Get all menus for a restaurant
   * GET /api/restaurants/:restaurantId/menus
   */
  export const getRestaurantMenus = async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { includeItems } = req.query;

      const result = await restaurantService.getRestaurantMenus(
        parseInt(restaurantId), 
        { includeItems: includeItems === 'true' }
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getRestaurantMenus controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch restaurant menus',
        error: error.message
      });
    }
  }

  /**
   * Get a specific menu by ID
   * GET /api/menus/:menuId
   */
  export const getMenu = async (req, res) => {
    try {
      const { menuId } = req.params;

      const result = await restaurantService.getMenu(parseInt(menuId));

      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu',
        error: error.message
      });
    }
  }

  /**
   * Delete a menu
   * DELETE /api/menus/:menuId
   */
  export const deleteMenu = async (req, res) => {
    try {
      const { menuId } = req.params;

      const result = await restaurantService.deleteMenu(parseInt(menuId));

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete menu',
        error: error.message
      });
    }
  }

  /**
   * Get menu statistics
   * GET /api/menus/:menuId/stats
   */
  export const getMenuStats = async (req, res) => {
    try {
      const { menuId } = req.params;

      const result = await restaurantService.getMenuStats(parseInt(menuId));

      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getMenuStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu statistics',
        error: error.message
      });
    }
  }

  // ============ ITEM CONTROLLERS ============

  /**
   * Create a new item
   * POST /api/items
   */
  export const createItem = async (req, res) => {
    try {
      const itemData = req.body;

      // Validation
      if (!itemData.itemId || !itemData.name || itemData.price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'itemId, name, and price are required'
        });
      }

      const result = await this.menuService.createItem(itemData);
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create item',
        error: error.message
      });
    }
  }

  /**
   * Get all items with pagination and filtering
   * GET /api/items
   */
  export const getAllItems = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search,
        priceMin,
        priceMax
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
        priceMin: priceMin ? parseFloat(priceMin) : null,
        priceMax: priceMax ? parseFloat(priceMax) : null
      };

      const result = await this.menuService.getAllItems(options);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllItems controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch items',
        error: error.message
      });
    }
  }

  /**
   * Get a specific item by ID
   * GET /api/items/:itemId
   */
  export const getItem = async (req, res) => {
    try {
      const { itemId } = req.params;

      const result = await restaurantService.getItem(parseInt(itemId));

      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch item',
        error: error.message
      });
    }
  }

  /**
   * Update an item
   * PUT /api/items/:itemId
   */
  export const updateItem = async (req, res) => {
    try {
      const { itemId } = req.params;
      const updateData = req.body;

      const result = await restaurantService.updateItem(parseInt(itemId), updateData);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update item',
        error: error.message
      });
    }
  }

  /**
   * Delete an item
   * DELETE /api/items/:itemId
   */
  export const deleteItem = async (req, res) => {
    try {
      const { itemId } = req.params;

      const result = await restaurantService.deleteItem(parseInt(itemId));

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteItem controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete item',
        error: error.message
      });
    }
  }

  // ============ MENU ITEM CONTROLLERS ============

  /**
   * Add an item to a menu
   * POST /api/menus/:menuId/items/:itemId
   */
  export const addItemToMenu = async (req, res) => {
    try {
      const { menuId, itemId } = req.params;

      const result = await restaurantService.addItemToMenu(
        parseInt(menuId), 
        parseInt(itemId)
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in addItemToMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to menu',
        error: error.message
      });
    }
  }

  /**
   * Remove an item from a menu
   * DELETE /api/menus/:menuId/items/:itemId
   */
  export const removeItemFromMenu = async (req, res) => {
    try {
      const { menuId, itemId } = req.params;

      const result = await restaurantService.removeItemFromMenu(
        parseInt(menuId), 
        parseInt(itemId)
      );
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in removeItemFromMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from menu',
        error: error.message
      });
    }
  }

  /**
   * Get all items in a specific menu
   * GET /api/menus/:menuId/items
   */
  export const getMenuItems = async (req, res) => {
    try {
      const { menuId } = req.params;
      const { status, search } = req.query;

      const result = await restaurantService.getMenuItems(
        parseInt(menuId), 
        { status, search }
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getMenuItems controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu items',
        error: error.message
      });
    }
  }

  /**
   * Bulk add items to a menu
   * POST /api/menus/:menuId/items/bulk
   * Body: { itemIds: [1, 2, 3, ...] }
   */
  export const bulkAddItemsToMenu = async (req, res) => {
    try {
      const { menuId } = req.params;
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'itemIds must be a non-empty array'
        });
      }

      const result = await restaurantService.bulkAddItemsToMenu(
        parseInt(menuId), 
        itemIds.map(id => parseInt(id))
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in bulkAddItemsToMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk add items to menu',
        error: error.message
      });
    }
  }

  /**
   * Bulk remove items from a menu
   * DELETE /api/menus/:menuId/items/bulk
   * Body: { itemIds: [1, 2, 3, ...] }
   */
  export const bulkRemoveItemsFromMenu = async (req, res) => {
    try {
      const { menuId } = req.params;
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'itemIds must be a non-empty array'
        });
      }

      const result = await restaurantService.bulkRemoveItemsFromMenu(
        parseInt(menuId), 
        itemIds.map(id => parseInt(id))
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in bulkRemoveItemsFromMenu controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk remove items from menu',
        error: error.message
      });
    }
  }
