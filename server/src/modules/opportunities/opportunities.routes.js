import { Router } from 'express';
import { getOpportunities, createOpportunity, getOpportunityById, updateOpportunity } from './opportunities.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getOpportunities);
router.post('/', validateRequest(['title', 'customer']), createOpportunity);
router.get('/:id', getOpportunityById);
router.patch('/:id', updateOpportunity);

export default router;
