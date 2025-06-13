import express from 'express';
import { GetRestaurants } from '../controllers/Restaurants/GetRestaurantsController.js';
import { CreateRestaurant } from '../controllers/Restaurants/CreateRestaurantController.js';
import { UpdateRestaurant } from '../controllers/Restaurants/UpdateRestaurantController.js';
import { DeleteRestaurant } from '../controllers/Restaurants/DeleteRestaurantController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(GetRestaurants)
  .post(authenticateToken, CreateRestaurant);

router.route('/:id')
  .put(authenticateToken, UpdateRestaurant)
  .delete(authenticateToken, DeleteRestaurant);

export default router;
