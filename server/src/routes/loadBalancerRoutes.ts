import { Router } from 'express';
import { getLoadBalancers, getLoadBalancer, createLoadBalancer, updateLoadBalancer, deleteLoadBalancer, cancelLoadBalancerDeployment, validateLoadBalancerHostname } from '../controllers/loadBalancerController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createLoadBalancerValidator } from '../middleware/validators/loadBalancerValidators';

const router = Router();

router.get('/', authenticate, getLoadBalancers);
router.post('/', authenticate, createLoadBalancerValidator, validate, createLoadBalancer);
router.post('/validate-hostname', authenticate, validateLoadBalancerHostname);
router.post('/operations/:operationId/cancel', authenticate, cancelLoadBalancerDeployment);
router.get('/:id', authenticate, getLoadBalancer);
router.put('/:id', authenticate, createLoadBalancerValidator, validate, updateLoadBalancer);
router.delete('/:id', authenticate, deleteLoadBalancer);

export default router;
