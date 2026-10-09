import { Router } from 'express';
import { getProjects, createProject, getProjectById, updateProject } from './projects.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getProjects);
router.post('/', authorize('super_admin', 'admin', 'property_manager'), validateRequest(['name', 'code']), createProject);
router.get('/:id', getProjectById);
router.patch('/:id', authorize('super_admin', 'admin', 'property_manager'), updateProject);

export default router;
