import express from 'express';
import { GetUsers } from '../controllers/Users/GetUsersController.js';
import { CreateUser } from '../controllers/Users/CreateUserController.js';
import { UpdateUser } from '../controllers/Users/UpdateUserController.js';
import { DeleteUser } from '../controllers/Users/DeleteUserController.js';
import { 
  authenticateToken, 
  authorize, 
  validateUserOwnership, 
  validateAdminOrSelf 
} from '../middleware/auth.js';

const router = express.Router();

// Routes
router.route('/')
  .get(authenticateToken, authorize(['admin']), GetUsers) // Only admins can list all users
  .post(authenticateToken, authorize(['admin']), CreateUser); // Only admins can create users

router.route('/:id')
  .put(authenticateToken, validateAdminOrSelf, UpdateUser) // User can update own profile, admin can update any
  .delete(authenticateToken, authorize(['admin']), DeleteUser); // Only admins can delete users

// Get user profile (user can get own profile, admin can get any)
router.get('/:id/profile', authenticateToken, validateAdminOrSelf, (req, res) => {
  // This would be handled by a GetUserProfile controller
  res.json({ message: 'Get user profile endpoint - implement GetUserProfile controller' });
});

export default router;
