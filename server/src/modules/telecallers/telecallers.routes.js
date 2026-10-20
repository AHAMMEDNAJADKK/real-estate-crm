import { Router } from 'express';
import {
  getCallLogs,
  recordCallLog,
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
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
router.get('/follow-ups/:id', getFollowUpById);
router.post('/follow-ups', validateRequest(['leadId', 'scheduledDate']), createFollowUp);
router.put('/follow-ups/:id', updateFollowUp);
router.patch('/follow-ups/:id', updateFollowUp);
router.delete('/follow-ups/:id', deleteFollowUp);

export default router;
