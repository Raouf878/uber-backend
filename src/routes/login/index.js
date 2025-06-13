import express from 'express';
import { LoginRestaurantOwner } from '../../controllers/Authentication/RestaurantOwner/RestaurantRegisterController';   
import { LoginDeliveryDriver } from '../../controllers/Authentication/DeliveryDriver/DeliveryRegistryController';
import { LoginClient } from '../../controllers/Authentication/Client/ClientLoginController';

const router = express.Router();

router.route('/login-client').post(LoginClient);
router.route('/login-restaurant-owner').post(LoginRestaurantOwner);
router.route('/login-delivery-driver').post(LoginDeliveryDriver);

export default router;