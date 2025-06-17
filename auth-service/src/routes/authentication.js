import express from 'express';
import { RegisterClient } from '../controllers/Authentication/Client/ClientRegisterController.js';

import { RegisterDeliveryDriver } from '../controllers/Authentication/DeliveryDriver/DeliveryRegistryController.js';
import { RestaurantAuthController } from '../controllers/Authentication/RestaurantOwner/RestaurantRegisterController.js';


const router = express.Router();
const restaurantController = new RestaurantAuthController();

// Routes
router.route('/create-account').post(RegisterClient);
router.use((req, res, next)=> {
    console.log(`Authentication Route Hit: ${req.method} ${req.path}`);
    next();
});
router.post('/create-account', restaurantController.RegisterRestaurantOwner.bind(restaurantController));
router.route('/create-restaurant-account').post(restaurantController.RegisterRestaurantOwner.bind(restaurantController));
router.route('/create-delivery-account').post(RegisterDeliveryDriver);

export default router;
