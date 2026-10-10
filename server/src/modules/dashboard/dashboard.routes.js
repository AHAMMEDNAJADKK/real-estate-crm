import { Router } from 'express';
import { getSummary, getPipeline, getPerformance } from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

router.get(['/summary', '/stats'], getSummary);
router.get('/pipeline', getPipeline);
router.get('/performance', getPerformance);

export default router;
