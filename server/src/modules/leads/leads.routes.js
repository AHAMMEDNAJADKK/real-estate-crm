import { Router } from 'express';
import {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
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
router.post('/import', authorize('superadmin', 'super_admin', 'admin', 'sales_manager'), importLeads);
router.get('/export', authorize('superadmin', 'super_admin', 'admin', 'sales_manager'), exportLeads);

router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.patch('/:id', updateLead);
router.delete('/:id', authorize('superadmin', 'super_admin', 'admin', 'sales_manager'), deleteLead);
router.patch(['/:id/assignment', '/:id/assign'], authorize('superadmin', 'super_admin', 'admin', 'sales_manager'), assignLead);
router.patch('/:id/status', updateLeadStatus);
router.get('/:id/history', getLeadHistory);

export default router;
