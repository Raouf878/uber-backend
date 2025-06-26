import express from 'express';
import RestaurantInfo from '../../../Databases/mongo/models/restaurant.js';
import {
  createRestaurant,
  getRestaurant,
  getUserRestaurants,
  getAllRestaurants,
  updateRestaurantLocation,
  deleteRestaurant,
  createMenu,
  getRestaurantMenus,
  getMenu,
  deleteMenu,
  getMenuStats,
  createItem,
  upload,
  getAllItems,
  getItem,
  updateItem,
  deleteItem,
  addItemToMenu,
  removeItemFromMenu,
  getMenuItems,
  bulkAddItemsToMenu,
  bulkRemoveItemsFromMenu,
  updateMenu
} from '../controllers/RestaurantController.js';
import { 
  authenticateToken, 
  authorize, 
  validateRestaurantOwnership, 
  validateMenuOwnership, 
  validateItemOwnership 
} from '../middleware/auth.js';

const router = express.Router();

// Middleware to log route hits
router.use((req, res, next) => {
    console.log(`Restaurant Route Hit: ${req.method} ${req.path}`);
    next();
});

// Restaurant routes
router.post('/restaurants', 
  authenticateToken, 
  authorize(['restaurant_owner', 'admin']), 
  createRestaurant
);

router.get('/get/restaurants', getAllRestaurants); // Public route for browsing

router.get('/restaurants/:id', getRestaurant); // Public route for viewing

router.get('/users/:userId/restaurants', 
  authenticateToken, 
  getUserRestaurants
);

router.put('/restaurants/:id/location', 
  authenticateToken, 
  validateRestaurantOwnership, 
  updateRestaurantLocation
);

router.delete('/restaurants/:id', 
  authenticateToken, 
  validateRestaurantOwnership, 
  deleteRestaurant
);

// Menu routes
router.post('/restaurants/:restaurantId/menus', 
  authenticateToken, 
  upload.single('image'),
  createMenu
);

router.get('/menus/:menuId', getMenu); // Public route

router.put('/menus/:menuId', 
  authenticateToken, 
  validateMenuOwnership, 
  updateMenu
);

router.delete('/menus/:menuId', 
  authenticateToken, 
  validateMenuOwnership, 
  deleteMenu
);

// Item routes
router.post('/restaurants/:restaurantId/items', 
  authenticateToken, 
  validateRestaurantOwnership, 
  createItem
);

router.post('/restaurants/:restaurantId/menus/:menuId/items', 
  authenticateToken, 
  validateRestaurantOwnership, 
  (req, res) => createItem(req, res, true)
);

router.get('/items', getAllItems); // Public route

router.get('/items/:itemId', getItem); // Public route

router.put('/items/:itemId', 
  authenticateToken, 
  validateItemOwnership, 
  updateItem
);

router.delete('/items/:itemId', 
  authenticateToken, 
  validateItemOwnership, 
  deleteItem
);

// Menu-Item relationship routes
router.post('/menus/:menuId/items/:itemId', 
  authenticateToken, 
  validateMenuOwnership, 
  addItemToMenu
);

router.delete('/menus/:menuId/items/:itemId', 
  authenticateToken, 
  validateMenuOwnership, 
  removeItemFromMenu
);

router.get('/menus/:menuId/items', getMenuItems); // Public route

router.post('/menus/:menuId/items/bulk-add', 
  authenticateToken, 
  validateMenuOwnership, 
  bulkAddItemsToMenu
);

router.delete('/menus/:menuId/items/bulk-remove', 
  authenticateToken, 
  validateMenuOwnership, 
  bulkRemoveItemsFromMenu
);

// Test route - no auth required
router.get('/test-mongo', async (req, res) => {
  try {
    const count = await RestaurantInfo.countDocuments();
    res.json({ mongoWorking: true, documentCount: count });
  } catch (error) {
    res.status(500).json({ mongoWorking: false, error: error.message });
  }
});

export default router;