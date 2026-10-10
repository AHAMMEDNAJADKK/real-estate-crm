import { Router } from 'express';
import {
  getPayments,
  recordPayment,
  verifyPayment,
  refundPayment,
  getReceipt,
  getPaymentSchedule
} from './payments.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getPayments);
router.post(
  '/',
  authorize('super_admin', 'admin', 'accountant'),
  validateRequest(['bookingId', 'amount']),
  recordPayment
);
router.get(['/:id/receipt', '/receipt/:id'], getReceipt);
router.post('/:id/verify', authorize('super_admin', 'admin', 'accountant'), verifyPayment);
router.post(
  '/:id/refund',
  authorize('super_admin', 'admin', 'accountant'),
  validateRequest(['refundAmount', 'reason']),
  refundPayment
);
router.get(['/booking/:id/schedule', '/schedule/:id'], getPaymentSchedule);

export default router;
