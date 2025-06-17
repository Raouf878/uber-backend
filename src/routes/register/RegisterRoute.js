import express from 'express';
import {RegisterClient} from '../../controllers/Authentication/Client/ClientRegisterController.js';
import {RegisterRestaurantOwner} from '../../controllers/Authentication/RestaurantOwner/RestaurantRegisterController.js';
import {RegisterDeliveryDriver} from '../../controllers/Authentication/DeliveryDriver/DeliveryRegistryController.js';


const router = express.Router();

// Routes
router.route('/create-account').post(RegisterClient);

router.route('/create-restaurant-account').post(RegisterRestaurantOwner);
router.route('/create-delivery-account').post(RegisterDeliveryDriver);


export default router;