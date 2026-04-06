import { Router } from 'express';
import { getProfile, changePassword } from '../controllers/userController';
import { changePasswordValidation } from '../middleware/validators/userValidators';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/password', authenticate, changePasswordValidation, validate, changePassword);

export default router;
