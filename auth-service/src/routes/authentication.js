import express from 'express';
import {
    RegisterClient,
    LoginClient,
    
   

} from '../controllers/Authentication/Client/ClientRegisterController.js';
import {
RegisterDeliveryDriver,
    DeliveryLogin,

} from '../controllers/Authentication/DeliveryDriver/DeliveryRegistryController.js';


import {
     RegisterRestaurant, 
    LoginRestaurantOwner

} from '../controllers/Authentication/RestaurantOwner/RestaurantRegisterController.js';




const router = express.Router();


// Routes

router.use((req, res, next)=> {
    console.log(`Authentication Route Hit: ${req.method} ${req.path}`);
    next();
});
router.post('/create-account',RegisterClient );
router.post('/create-restaurant-account',RegisterRestaurant);
router.post('/create-delivery-account',RegisterDeliveryDriver);
router.post('/login-account',LoginClient );
router.post('/login-restaurant-account',LoginRestaurantOwner);
router.post('/login-delivery-account',DeliveryLogin);


export default router;
