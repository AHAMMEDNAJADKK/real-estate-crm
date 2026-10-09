import { Router } from 'express';
import { getTransactions, createTransaction, getReconciliationSummary } from './accounts.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/transactions', authorize('super_admin', 'admin', 'accountant'), getTransactions);
router.post(
  '/transactions',
  authorize('super_admin', 'admin', 'accountant'),
  validateRequest(['type', 'category', 'amount']),
  createTransaction
);
router.get('/reconciliation', authorize('super_admin', 'admin', 'accountant'), getReconciliationSummary);

export default router;
