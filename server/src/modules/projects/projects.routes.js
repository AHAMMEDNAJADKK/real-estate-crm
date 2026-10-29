import { Router } from 'express';
import { getProjects, createProject, getProjectById, updateProject, deleteProject } from './projects.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();
router.use(authenticate);

router.get('/', getProjects);
router.post('/', authorize('superadmin', 'super_admin', 'admin', 'property_manager'), validateRequest(['name', 'code']), createProject);
router.get('/:id', getProjectById);
router.put('/:id', authorize('superadmin', 'super_admin', 'admin', 'property_manager'), updateProject);
router.patch('/:id', authorize('superadmin', 'super_admin', 'admin', 'property_manager'), updateProject);
router.delete('/:id', authorize('superadmin', 'super_admin', 'admin', 'property_manager'), deleteProject);

export default router;
