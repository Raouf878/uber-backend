import express from 'express';
import router from express.Router();
import { registerUser } from '../../controllers/registerController.js';


router.route('/register').post(RegisterUser);
router.route('//create acount').post(RegisterUser);



module.exports = router;