import { Router } from 'express';
import { saveCredentials, updateCredentials, getCredentials, getZones } from '../controllers/cloudflareController';
import { credentialsValidation } from '../middleware/validators/cloudflareValidators';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/credentials', authenticate, credentialsValidation, validate, saveCredentials);
router.put('/credentials', authenticate, credentialsValidation, validate, updateCredentials);
router.get('/credentials', authenticate, getCredentials);
router.get('/zones', authenticate, getZones);

export default router;
