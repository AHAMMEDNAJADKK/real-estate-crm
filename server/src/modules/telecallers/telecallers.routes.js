import { Router } from 'express';
import {
  getCallLogs,
  recordCallLog,
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  getCallingQueue
} from './telecallers.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/queue', getCallingQueue);
router.get('/call-logs', getCallLogs);
router.post('/call-logs', validateRequest(['leadId', 'callOutcome']), recordCallLog);
router.get('/follow-ups', getFollowUps);
router.post('/follow-ups', validateRequest(['leadId', 'scheduledDate']), createFollowUp);
router.patch('/follow-ups/:id', updateFollowUp);

export default router;
