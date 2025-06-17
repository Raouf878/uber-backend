import express from 'express';
import { RestaurantController } from '../controllers/RestaurantController.js';


const router = express.Router();

const restaurantController = new RestaurantController();

// Routes
router.use((req, res, next) => {
    console.log(`Restaurant Route Hit: ${req.method} ${req.path}`);
    next();
});
router.get('/restaurants/:id', restaurantController.getRestaurant.bind(restaurantController));


export default router;
