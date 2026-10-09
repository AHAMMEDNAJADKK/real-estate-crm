import { Router } from 'express';
import { getCommissions, approveCommission, payoutCommission } from './commissions.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();
router.use(authenticate);

router.get('/', getCommissions);
router.patch('/:id/approve', authorize('super_admin', 'admin', 'sales_manager'), approveCommission);
router.patch('/:id/pay', authorize('super_admin', 'admin', 'accountant'), payoutCommission);

export default router;
