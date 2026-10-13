import { Router } from 'express';
import {
  getSystemOverview,
  getSuperAdminUsers,
  createSuperAdminUser,
  updateSuperAdminUser,
  deleteSuperAdminUser,
  getSuperAdminAuditLogs
} from './superadmin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeSuperAdmin } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

// Strictly enforce authentication + Super Admin role on all routes in this module
router.use(authenticate, authorizeSuperAdmin);

router.get('/overview', getSystemOverview);
router.get('/users', getSuperAdminUsers);
router.post(
  '/users',
  validateRequest(['name', 'email', 'phone', 'password', 'role']),
  createSuperAdminUser
);
router.patch('/users/:id', updateSuperAdminUser);
router.patch('/users/:id/role', updateSuperAdminUser);
router.patch('/users/:id/status', updateSuperAdminUser);
router.delete('/users/:id', deleteSuperAdminUser);
router.get('/audit-logs', getSuperAdminAuditLogs);

export default router;
