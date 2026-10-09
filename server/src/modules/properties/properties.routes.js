import { Router } from 'express';
import { getProperties, createProperty, getPropertyById, updateProperty } from './properties.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getProperties);
router.post(
  '/',
  authorize('super_admin', 'admin', 'property_manager'),
  validateRequest(['unitNumber', 'project', 'superBuiltUpAreaSqFt', 'listedPrice']),
  createProperty
);
router.get('/:id', getPropertyById);
router.patch(
  '/:id',
  authorize('super_admin', 'admin', 'property_manager', 'sales_manager'),
  updateProperty
);

export default router;
