import express from 'express';
import {RegisterClient} from '../../controllers/Authentication/Client/ClientRegisterController.js';


const router = express.Router();

// Routes
router.route('/create-account').post(RegisterClient);


export default router; // Fixed: ES module export instead of CommonJS