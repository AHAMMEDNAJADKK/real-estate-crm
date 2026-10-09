import { Router } from 'express';
import { getSettings, updateSettings, getAuditLogs, handleFileUpload } from './settings.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { upload } from '../../middleware/upload.js';

const router = Router();
router.use(authenticate);

router.get('/', getSettings);
router.patch('/', authorize('super_admin', 'admin'), updateSettings);
router.get('/audit-logs', authorize('super_admin', 'admin'), getAuditLogs);
router.post('/upload', upload.single('file'), handleFileUpload);

export default router;
