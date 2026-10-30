import { Router } from 'express';
import { getDashboardKPIs } from '../controllers/dashboard.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();

// Protegido por el menú "Inicio"
router.get('/', verificarToken, requerirPermiso('Inicio', 'PUEDE_VER'), getDashboardKPIs);

export default router;