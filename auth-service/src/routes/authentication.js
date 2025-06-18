import express from 'express';

import { RestaurantAuthController } from '../controllers/Authentication/RestaurantOwner/RestaurantRegisterController.js';


const router = express.Router();
const restaurantController = new RestaurantAuthController();

// Routes

router.use((req, res, next)=> {
    console.log(`Authentication Route Hit: ${req.method} ${req.path}`);
    next();
});
router.post('/create-account', restaurantController.RegisterRestaurantOwner.bind(restaurantController));
router.post('/create-restaurant-account', restaurantController.RegisterRestaurantOwner.bind(restaurantController));


export default router;
