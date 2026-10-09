import { Router } from 'express';
import { getUsers, createUser, updateUser, getUserWorkload } from './employees.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getUsers);
router.post(
  '/',
  authorize('super_admin', 'admin'),
  validateRequest(['name', 'email', 'phone', 'password', 'role']),
  createUser
);
router.get('/:id/workload', getUserWorkload);
router.patch('/:id', authorize('super_admin', 'admin'), updateUser);

export default router;
