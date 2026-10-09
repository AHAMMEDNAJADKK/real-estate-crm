import { Router } from 'express';
import { getReport } from './reports.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();
router.use(authenticate);

router.get('/:reportType', authorize('super_admin', 'admin', 'sales_manager', 'accountant'), getReport);

export default router;
