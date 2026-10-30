import { Router } from 'express';
import { getReporteCartera } from '../controllers/reportes.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();
const NOMBRE_MENU = 'Reportes';

// Endpoint para obtener la sábana de datos de la cartera
router.get('/cartera', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getReporteCartera);

export default router;