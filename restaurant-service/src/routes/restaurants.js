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

const router = express.Router();

// Middleware to log route hits
router.use((req, res, next) => {
    console.log(`Restaurant Route Hit: ${req.method} ${req.path}`);
    next();
});

// Restaurant routes
router.post('/restaurants', createRestaurant);
router.get('/get/restaurants', getAllRestaurants);
router.get('/restaurants/:id', getRestaurant);
router.get('/users/:userId/restaurants', getUserRestaurants);
router.put('/restaurants/:id/location', updateRestaurantLocation);
router.delete('/restaurants/:id', deleteRestaurant);

// Menu routes
router.post('/restaurants/:restaurantId/menus', createMenu);
router.get('/menus/:menuId', getMenu);
router.put('/menus/:menuId', updateMenu);
router.delete('/menus/:menuId', deleteMenu);

// Item routes
router.post('/restaurants/:restaurantId/items', createItem); // create item for restaurant
router.post('/restaurants/:restaurantId/menus/:menuId/items', (req, res) => createItem(req, res, true)); // create item and add to menu
router.get('/items', getAllItems);
router.get('/items/:itemId', getItem);
router.put('/items/:itemId', updateItem);
router.delete('/items/:itemId', deleteItem);

// Menu-Item relationship routes
router.post('/menus/:menuId/items/:itemId', addItemToMenu);
router.delete('/menus/:menuId/items/:itemId', removeItemFromMenu);
router.get('/menus/:menuId/items', getMenuItems);
router.post('/menus/:menuId/items/bulk-add', bulkAddItemsToMenu);
router.delete('/menus/:menuId/items/bulk-remove', bulkRemoveItemsFromMenu);

router.get('/test-mongo', async (req, res) => {
  try {
    const count = await RestaurantInfo.countDocuments();
    res.json({ mongoWorking: true, documentCount: count });
  } catch (error) {
    res.status(500).json({ mongoWorking: false, error: error.message });
  }
});

export default router;