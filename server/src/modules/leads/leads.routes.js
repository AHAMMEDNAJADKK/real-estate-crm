import { Router } from 'express';
import {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  assignLead,
  updateLeadStatus,
  getLeadHistory,
  importLeads,
  exportLeads
} from './leads.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

router.use(authenticate);

router.get('/', getLeads);
router.post('/', validateRequest(['leadName', 'phone']), createLead);
router.post('/import', authorize('super_admin', 'admin', 'sales_manager'), importLeads);
router.get('/export', authorize('super_admin', 'admin', 'sales_manager'), exportLeads);

router.get('/:id', getLeadById);
router.patch('/:id', updateLead);
router.patch(['/:id/assignment', '/:id/assign'], authorize('super_admin', 'admin', 'sales_manager'), assignLead);
router.patch('/:id/status', updateLeadStatus);
router.get('/:id/history', getLeadHistory);

export default router;
