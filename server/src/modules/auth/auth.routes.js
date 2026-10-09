import { Router } from 'express';
import { login, getMe, logout } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

router.post('/login', validateRequest(['email', 'password']), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
