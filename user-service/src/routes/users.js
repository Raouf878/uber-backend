import express from 'express';
import { GetUsers } from '../controllers/Users/GetUsersController.js';
import { CreateUser } from '../controllers/Users/CreateUserController.js';
import { UpdateUser } from '../controllers/Users/UpdateUserController.js';
import { DeleteUser } from '../controllers/Users/DeleteUserController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, GetUsers)
  .post(authenticateToken, CreateUser);

router.route('/:id')
  .put(authenticateToken, UpdateUser)
  .delete(authenticateToken, DeleteUser);

export default router;
