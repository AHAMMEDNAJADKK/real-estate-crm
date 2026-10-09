import { Router } from 'express';
import { getMeetings, createMeeting, updateMeeting } from './meetings.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getMeetings);
router.post('/', validateRequest(['title', 'scheduledDate']), createMeeting);
router.patch('/:id', updateMeeting);

export default router;
