import { Router } from 'express';
import { getCustomers, createCustomer, getCustomer360, updateCustomer } from './customers.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getCustomers);
router.post('/', validateRequest(['name', 'phone']), createCustomer);
router.get('/:id', getCustomer360);
router.patch('/:id', updateCustomer);

export default router;
