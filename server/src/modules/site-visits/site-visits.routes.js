import { Router } from 'express';
import { getSiteVisits, createSiteVisit, updateSiteVisit } from './site-visits.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getSiteVisits);
router.post('/', validateRequest(['project', 'visitDate']), createSiteVisit);
router.patch('/:id', updateSiteVisit);

export default router;
