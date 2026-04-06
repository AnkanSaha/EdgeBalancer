import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController';
import { registerValidation, loginValidation } from '../middleware/validators/authValidators';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
