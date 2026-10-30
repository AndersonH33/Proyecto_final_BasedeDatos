import { Router } from 'express';
import { getPagos, createPago } from '../controllers/pagos.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { requerirPermiso } from '../middleware/permisos.middleware.js';

const router = Router();
const NOMBRE_MENU = 'Pagos'; // Debe coincidir con SQL Server

// Protegidas por token y permisos
router.get('/', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_VER'), getPagos);
router.post('/', verificarToken, requerirPermiso(NOMBRE_MENU, 'PUEDE_CREAR'), createPago);

export default router;