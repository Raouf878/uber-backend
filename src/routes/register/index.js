import express from 'express';
import router from express.Router();
import RegisterClient from '../../controllers/Authentication/Client/ClientRegisterController.js';


router.route('/register').post(RegisterClient);
router.route('//create acount').post(RegisterUser);



module.exports = router;