import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = Router();

// Endpoint: POST /api/auth/login
router.post('/login', login);
router.get('/me', verificarToken, getMe);
export default router;