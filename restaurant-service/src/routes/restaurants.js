import express from 'express';
import {
  createRestaurant,
  getRestaurant,
  getUserRestaurants,
  getAllRestaurants,
  updateRestaurantLocation,
  deleteRestaurant,
  createMenu,
} from '../controllers/RestaurantController.js';

const router = express.Router();

// Middleware to log route hits
router.use((req, res, next) => {
    console.log(`Restaurant Route Hit: ${req.method} ${req.path}`);
    next();
});

// Routes
router.post('/restaurants', createRestaurant);
router.get('/restaurants', getAllRestaurants);
router.get('/restaurants/:id', getRestaurant);
router.get('/users/:userId/restaurants', getUserRestaurants);
router.put('/restaurants/:id/location', updateRestaurantLocation);
router.delete('/restaurants/:id', deleteRestaurant);
router.post('/restaurants/:restaurantId/menus', createMenu);
router.get('/test-mongo', async (req, res) => {
  try {
    const count = await RestaurantInfo.countDocuments();
    res.json({ mongoWorking: true, documentCount: count });
  } catch (error) {
    res.status(500).json({ mongoWorking: false, error: error.message });
  }
});

export default router;